# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
from unittest.mock import MagicMock, PropertyMock, mock_open, patch

import cv2
import numpy

from resource_management.deployment_package_manager import DeploymentPackageManager, OVWeightsKey

from iai_core.entities.project import Project
from iai_core.repos import ModelRepo


class TestDeploymentPackageManager:
    def test_prepare_geti_sdk_package(
        self,
        fxt_project,
        fxt_project_rest,
        fxt_optimized_model_1_with_exportable_code,
        fxt_optimized_model_2_with_exportable_code,
        fxt_model_identifiers,
    ) -> None:
        # Mock model adapters with PropertyMock instead of trying to set them directly
        model1_adapters = {
            OVWeightsKey.OPENVINO_XML.value: MagicMock(data=b"xml_data_1"),
            OVWeightsKey.OPENVINO_BIN.value: MagicMock(data=b"bin_data_1"),
        }

        model2_adapters = {
            OVWeightsKey.OPENVINO_XML.value: MagicMock(data=b"xml_data_2"),
            OVWeightsKey.OPENVINO_BIN.value: MagicMock(data=b"bin_data_2"),
            OVWeightsKey.TILE_CLASSIFIER_XML.value: MagicMock(data=b"tile_xml_data"),
            OVWeightsKey.TILE_CLASSIFIER_BIN.value: MagicMock(data=b"tile_bin_data"),
        }

        # Use PropertyMock to mock the model_adapters property
        type(fxt_optimized_model_1_with_exportable_code).model_adapters = PropertyMock(return_value=model1_adapters)
        type(fxt_optimized_model_2_with_exportable_code).model_adapters = PropertyMock(return_value=model2_adapters)

        # Mock the task nodes
        task_node_1 = MagicMock()
        task_node_1.title = "task_1"

        # Mock config extraction
        mock_config = {"task_type": "detection", "model_parameters": {}}

        with (
            patch.object(
                ModelRepo,
                "get_by_id",
                side_effect=[
                    fxt_optimized_model_1_with_exportable_code,
                    fxt_optimized_model_2_with_exportable_code,
                ],
            ),
            patch.object(
                Project,
                "get_trainable_task_node_by_id",
                return_value=task_node_1,
            ),
            patch.object(
                DeploymentPackageManager,
                "_get_random_image_from_project",
                return_value=cv2.cvtColor(numpy.zeros([10, 10, 3], dtype=numpy.uint8), cv2.COLOR_BGR2RGB),
            ),
            patch.object(
                ModelRepo,
                "get_latest_model_for_inference",
                side_effect=[
                    fxt_optimized_model_1_with_exportable_code,
                    fxt_optimized_model_2_with_exportable_code,
                ],
            ),
            patch.object(
                ModelRepo,
                "get_all_equivalent_model_ids",
                side_effect=[
                    [fxt_optimized_model_1_with_exportable_code.id_],
                    [fxt_optimized_model_2_with_exportable_code.id_],
                ],
            ),
            patch.object(
                DeploymentPackageManager,
                "extract_config_json_from_xml",
                return_value=mock_config,
            ),
            patch("builtins.open", mock_open()) as mock_file,
            patch("os.makedirs"),
            patch("shutil.copytree"),
            patch("zipfile.ZipFile") as mock_zipfile,
        ):
            # Mock the ZipFile instance
            mock_zipfile_instance = MagicMock()
            mock_zipfile.return_value.__enter__.return_value = mock_zipfile_instance

            DeploymentPackageManager.prepare_geti_sdk_package(
                project=fxt_project,
                project_rest_view=fxt_project_rest,
                model_identifiers=fxt_model_identifiers,
            )

            # Check file writes by verifying the correct filenames are used
            file_writes = [args[0] for args, _ in mock_file.call_args_list]

            # Check model files
            assert any("model.bin" in filename for filename in file_writes)
            assert any("model.xml" in filename for filename in file_writes)
            assert any("config.json" in filename for filename in file_writes)
            assert any("tile_classifier.bin" in filename for filename in file_writes)
            assert any("tile_classifier.xml" in filename for filename in file_writes)

            # Verify requirements.txt is written
            assert any("requirements.txt" in filename for filename in file_writes)

            # Verify project.json is written
            assert any("project.json" in filename for filename in file_writes)

    def test_extract_config_json_from_xml(self) -> None:
        sample_xml = b"""
        <net>
            <rt_info>
                <model_info>
                    <model_type value="object_detection"/>
                    <task_type value="detection"/>
                    <labels value="person car bicycle"/>
                    <label_ids value="1 2 3"/>
                </model_info>
            </rt_info>
        </net>
        """

        result = DeploymentPackageManager.extract_config_json_from_xml(sample_xml)

        # Verify the result
        assert result["model_type"] == "object_detection"
        assert result["task_type"] == "detection"
        assert result["model_parameters"]["labels"] == "person car bicycle"
        assert result["model_parameters"]["label_ids"] == "1 2 3"

        # Test with missing optional fields
        minimal_xml = b"""
        <net>
            <rt_info>
                <model_info>
                    <task_type value="classification"/>
                </model_info>
            </rt_info>
        </net>
        """

        minimal_result = DeploymentPackageManager.extract_config_json_from_xml(minimal_xml)

        # Verify the minimal result has default values for missing fields
        assert "model_type" not in minimal_result
        assert minimal_result["task_type"] == "classification"
        assert "labels" not in minimal_result["model_parameters"]
        assert "label_ids" not in minimal_result["model_parameters"]
