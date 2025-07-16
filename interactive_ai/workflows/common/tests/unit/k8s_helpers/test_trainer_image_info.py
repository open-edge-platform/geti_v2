# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import os
from unittest.mock import MagicMock, patch

import pytest
from iai_core.entities.model import TrainingFramework, TrainingFrameworkType

from jobs_common.k8s_helpers.trainer_image_info import TrainerImageInfo


class TestTrainerImageInfo:
    @pytest.mark.parametrize(
        "training_framework, feature_flag_otx_version_selection, image_full_name, render_gid",
        [
            (
                TrainingFramework(type=TrainingFrameworkType.OTX, version="2.1.0"),
                "false",
                "otx2_image",
                0,
            ),
            (
                TrainingFramework(type=TrainingFrameworkType.OTX, version="1.6.0"),
                "false",
                "otx2_image",
                0,
            ),
            (
                TrainingFramework(type=TrainingFrameworkType.OTX, version="2.1.0"),
                "true",
                "otx2_image",
                992,
            ),
            (
                TrainingFramework(type=TrainingFrameworkType.OTX, version="1.6.0"),
                "true",
                "otx2_image",
                992,
            ),
        ],
    )
    @patch("jobs_common.k8s_helpers.trainer_image_info.get_config_map")
    def test_create(
        self,
        mock_get_config_map,
        training_framework,
        feature_flag_otx_version_selection,
        image_full_name,
        render_gid,
    ):
        os.environ.update(
            {
                "FEATURE_FLAG_OTX_VERSION_SELECTION": feature_flag_otx_version_selection,
            }
        )
        configmap_data = {
            "registry_address": "registry",
            "tag": "develop",
            "ote_image": "ote_image",
            "otx2_image": "otx2_image",
            "render_gid": str(render_gid),
        }
        mock_get_config_map.return_value = MagicMock()
        mock_get_config_map.return_value.data.get.side_effect = lambda key: configmap_data.get(key)

        trainer_image_info = TrainerImageInfo.create(training_framework)

        assert trainer_image_info.to_image_full_name() == image_full_name
        assert trainer_image_info.render_gid == render_gid
