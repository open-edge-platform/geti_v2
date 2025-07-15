# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

from copy import deepcopy
from unittest.mock import patch
from uuid import UUID

import mongomock
import pytest
from bson import UUID_SUBTYPE, Binary, ObjectId, UuidRepresentation
from pymongo import MongoClient
from pymongo.database import Database

from migration.scripts.reduce_anomaly_tasks import ReduceAnomalyTasksMigration

ORGANIZATION_ID = UUID("11fdb5ad-8e0d-4301-b22b-06589beef658")
WORKSPACE_ID = UUID("11fdb5ad-8e0d-4301-b22b-06589beef658")
PROJECT_ID = ObjectId("66a0faf070cdf6d0b2ec5f93")


@pytest.fixture
def fxt_project() -> dict:
    return {
        "organization_id": ORGANIZATION_ID,
        "workspace_id": WORKSPACE_ID,
        "_id": PROJECT_ID,
        "performance": {
            "score": 0.4,
            "task_performances": [
                {
                    "score": {"value": 0.4, "metric_type": "f-measure"},
                    "global_score": {"value": 0.4, "metric_type": "f-measure"},
                    "local_score": {"value": 0.1, "metric_type": "f-measure"},
                }
            ],
        },
        "project_type": "UNDEFINED",
        "task_graph": {"pipeline_representation": "UNDEFINED"},
    }


@pytest.fixture
def fxt_anomaly_classification_project(fxt_project) -> dict:
    anomaly_classification_project = deepcopy(fxt_project)
    anomaly_classification_project["project_type"] = "ANOMALY_CLASSIFICATION"
    anomaly_classification_project["task_graph"]["pipeline_representation"] = "Dataset → Anomaly classification"
    return anomaly_classification_project


@pytest.fixture
def fxt_anomaly_detection_project(fxt_project) -> dict:
    anomaly_detection_project = deepcopy(fxt_project)
    anomaly_detection_project["project_type"] = "ANOMALY_DETECTION"
    anomaly_detection_project["task_graph"]["pipeline_representation"] = "Dataset → Anomaly detection"
    return anomaly_detection_project


@pytest.fixture
def fxt_anomaly_segmentation_project(fxt_project) -> dict:
    anomaly_segmentation_project = deepcopy(fxt_project)
    anomaly_segmentation_project["project_type"] = "ANOMALY_SEGMENTATION"
    anomaly_segmentation_project["task_graph"]["pipeline_representation"] = "Dataset → Anomaly segmentation"
    return anomaly_segmentation_project


@pytest.fixture
def fxt_label() -> dict:
    return {
        "domain": "UNDEFINED",
        "is_anomalous": True,
        "organization_id": ORGANIZATION_ID,
        "workspace_id": WORKSPACE_ID,
        "project_id": PROJECT_ID,
    }


@pytest.fixture
def fxt_anomaly_classification_label(fxt_label) -> dict:
    anomaly_classification_label = deepcopy(fxt_label)
    anomaly_classification_label["domain"] = "ANOMALY_CLASSIFICATION"
    return anomaly_classification_label


@pytest.fixture
def fxt_anomaly_detection_label(fxt_label) -> dict:
    anomaly_detection_label = deepcopy(fxt_label)
    anomaly_detection_label["domain"] = "ANOMALY_DETECTION"
    return anomaly_detection_label


@pytest.fixture
def fxt_anomaly_segmentation_label(fxt_label) -> dict:
    anomaly_segmentation_label = deepcopy(fxt_label)
    anomaly_segmentation_label["domain"] = "ANOMALY_SEGMENTATION"
    return anomaly_segmentation_label


@pytest.fixture
def fxt_task_node() -> dict:
    return {
        "workspace_id": WORKSPACE_ID,
        "organization_id": ORGANIZATION_ID,
        "project_id": PROJECT_ID,
        "task_type": "UNDEFINED",
        "task_title": "UNDEFINED",
    }


@pytest.fixture
def fxt_anomaly_classification_task_node(fxt_task_node) -> dict:
    anomaly_classification_task_node = deepcopy(fxt_task_node)
    anomaly_classification_task_node["task_type"] = "ANOMALY_CLASSIFICATION"
    anomaly_classification_task_node["task_title"] = "Anomaly classification"
    return anomaly_classification_task_node


@pytest.fixture
def fxt_anomaly_detection_task_node(fxt_task_node) -> dict:
    anomaly_detection_task_node = deepcopy(fxt_task_node)
    anomaly_detection_task_node["task_type"] = "ANOMALY_DETECTION"
    anomaly_detection_task_node["task_title"] = "Anomaly detection"
    return anomaly_detection_task_node


@pytest.fixture
def fxt_anomaly_segmentation_task_node(fxt_task_node) -> dict:
    anomaly_segmentation_task_node = deepcopy(fxt_task_node)
    anomaly_segmentation_task_node["task_type"] = "ANOMALY_SEGMENTATION"
    anomaly_segmentation_task_node["task_title"] = "Anomaly segmentation"
    return anomaly_segmentation_task_node


@pytest.fixture
def fxt_label_schema() -> dict:
    return {
        "workspace_id": WORKSPACE_ID,
        "organization_id": ORGANIZATION_ID,
        "project_id": PROJECT_ID,
        "label_groups": [{"name": "UNDEFINED"}],
    }


@pytest.fixture
def fxt_anomaly_classification_label_schema(fxt_label_schema) -> dict:
    anomaly_classification_label_schema = deepcopy(fxt_label_schema)
    anomaly_classification_label_schema["label_groups"][0]["name"] = "default - anomaly_classification"
    return anomaly_classification_label_schema


@pytest.fixture
def fxt_anomaly_detection_label_schema(fxt_label_schema) -> dict:
    anomaly_detection_label_schema = deepcopy(fxt_label_schema)
    anomaly_detection_label_schema["label_groups"][0]["name"] = "default - anomaly_detection"
    return anomaly_detection_label_schema


@pytest.fixture
def fxt_anomaly_segmentation_label_schema(fxt_label_schema) -> dict:
    anomaly_segmentation_label_schema = deepcopy(fxt_label_schema)
    anomaly_segmentation_label_schema["label_groups"][0]["name"] = "default - anomaly_segmentation"
    return anomaly_segmentation_label_schema


@pytest.fixture
def fxt_annotation_scene() -> dict:
    return {
        "_id": ObjectId("66a0faf070cdf6d0b2ec5f94"),
        "workspace_id": WORKSPACE_ID,
        "organization_id": ORGANIZATION_ID,
        "project_id": PROJECT_ID,
        "annotations": [
            {"shape": {"type": "RECTANGLE", "x1": 0, "y1": 0, "x2": 1, "y2": 1}},  # accept
            {"shape": {"type": "RECTANGLE", "x1": 0, "y1": 0, "x2": 1, "y2": 0.9}},  # reject
            {"shape": {"type": "POLYGON", "points": [{"x": 0, "y": 0}]}},  # reject
            {"shape": {"type": "ELLIPSE", "x1": 0, "y1": 0, "x2": 1, "y2": 1}},  # reject
        ],
    }


@pytest.fixture
def fxt_annotation_scene_state() -> dict:
    return {
        "_id": ObjectId("66a0faf070cdf6d0b2ec5f95"),
        "workspace_id": WORKSPACE_ID,
        "organization_id": ORGANIZATION_ID,
        "project_id": PROJECT_ID,
        "media_annotation_state": "PARTIALLY_ANNOTATED",
        "state_per_task": [
            {
                "annotation_state": "PARTIALLY_ANNOTATED",
            },
        ],
    }


@pytest.fixture
def fxt_model() -> dict:
    return {
        "_id": ObjectId("66a0faf070cdf6d0b2ec5f96"),
        "workspace_id": WORKSPACE_ID,
        "organization_id": ORGANIZATION_ID,
        "project_id": PROJECT_ID,
        "configuration": {
            "label_schema": {
                "_id": ObjectId("66a0faf070cdf6d0b2ec5f97"),
                "label_groups": [
                    {
                        "_id": ObjectId("66a0faf070cdf6d0b2ec5f98"),
                        "name": "UNDEFINED",
                    }
                ],
            }
        },
    }


@pytest.fixture
def fxt_anomaly_classification_model(fxt_model) -> dict:
    anom_cls_model = deepcopy(fxt_model)
    anom_cls_model["configuration"]["label_schema"]["label_groups"][0]["name"] = "default - anomaly_classification"
    return anom_cls_model


@pytest.fixture
def fxt_anomaly_detection_model(fxt_model) -> dict:
    anom_det_model = deepcopy(fxt_model)
    anom_det_model["configuration"]["label_schema"]["label_groups"][0]["name"] = "default - anomaly_detection"
    return anom_det_model


@pytest.fixture
def fxt_anomaly_segmentation_model(fxt_model) -> dict:
    anom_seg_model = deepcopy(fxt_model)
    anom_seg_model["configuration"]["label_schema"]["label_groups"][0]["name"] = "default - anomaly_segmentation"
    return anom_seg_model


@pytest.fixture
def fxt_model_storage() -> dict:
    return {
        "_id": ObjectId("66a0faf070cdf6d0b2ec5f97"),
        "workspace_id": WORKSPACE_ID,
        "organization_id": ORGANIZATION_ID,
        "project_id": PROJECT_ID,
        "model_template_id": "UNDEFINED",
    }


@pytest.fixture
def fxt_anomaly_classification_model_storage(fxt_model_storage) -> dict:
    anomaly_classification_model_storage = deepcopy(fxt_model_storage)
    anomaly_classification_model_storage["model_template_id"] = "ote_anomaly_classification_padim"
    return anomaly_classification_model_storage


@pytest.fixture
def fxt_anomaly_detection_model_storage(fxt_model_storage) -> dict:
    anomaly_detection_model_storage = deepcopy(fxt_model_storage)
    anomaly_detection_model_storage["model_template_id"] = "ote_anomaly_detection_padim"
    return anomaly_detection_model_storage


@pytest.fixture
def fxt_anomaly_segmentation_model_storage(fxt_model_storage) -> dict:
    anomaly_segmentation_model_storage = deepcopy(fxt_model_storage)
    anomaly_segmentation_model_storage["model_template_id"] = "ote_anomaly_segmentation_padim"
    return anomaly_segmentation_model_storage


def side_effect_mongo_mock_from_uuid(uuid: UUID, uuid_representation=UuidRepresentation.STANDARD):
    """Override (Mock) the bson.binary.Binary.from_uuid function to work for mongomock
    Code is copy pasted from the original function,
    but `uuid_representation` is ignored and only code parts as if
    uuid_representation == UuidRepresentation.STANDARD are used
    """
    if not isinstance(uuid, UUID):
        raise TypeError("uuid must be an instance of uuid.UUID")

    subtype = UUID_SUBTYPE
    payload = uuid.bytes

    return Binary(payload, subtype)


@pytest.fixture
def fxt_mongo_uuid(monkeypatch):
    with patch.object(Binary, "from_uuid", side_effect=side_effect_mongo_mock_from_uuid):
        yield


class TestAnomalyReductionProcessMigration:
    @pytest.mark.parametrize(
        "lazyfxt_project, lazyfxt_label, lazyfxt_label_schema, lazyfxt_model, lazyfxt_model_storage, lazyfxt_task_node",
        [
            (
                "fxt_anomaly_classification_project",
                "fxt_anomaly_classification_label",
                "fxt_anomaly_classification_label_schema",
                "fxt_anomaly_classification_model",
                "fxt_anomaly_classification_model_storage",
                "fxt_anomaly_classification_task_node",
            ),
            (
                "fxt_anomaly_detection_project",
                "fxt_anomaly_detection_label",
                "fxt_anomaly_detection_label_schema",
                "fxt_anomaly_detection_model",
                "fxt_anomaly_detection_model_storage",
                "fxt_anomaly_detection_task_node",
            ),
            (
                "fxt_anomaly_segmentation_project",
                "fxt_anomaly_segmentation_label",
                "fxt_anomaly_segmentation_label_schema",
                "fxt_anomaly_segmentation_model",
                "fxt_anomaly_segmentation_model_storage",
                "fxt_anomaly_segmentation_task_node",
            ),
        ],
        ids=[
            "Anomaly classification",
            "Anomaly detection",
            "Anomaly segmentation",
        ],
    )
    def test_upgrade_project(
        self,
        fxt_mongo_uuid,
        lazyfxt_project,
        lazyfxt_label,
        lazyfxt_label_schema,
        lazyfxt_model,
        lazyfxt_model_storage,
        lazyfxt_task_node,
        fxt_annotation_scene,
        fxt_annotation_scene_state,
        request,
    ):
        # Arrange
        project = request.getfixturevalue(lazyfxt_project)
        label = request.getfixturevalue(lazyfxt_label)
        label_schema = request.getfixturevalue(lazyfxt_label_schema)
        model = request.getfixturevalue(lazyfxt_model)
        model_storage = request.getfixturevalue(lazyfxt_model_storage)
        task_node = request.getfixturevalue(lazyfxt_task_node)

        mock_db: Database = mongomock.MongoClient(uuidRepresentation="standard").db
        project_collection = mock_db.create_collection("project")
        label_collection = mock_db.create_collection("label")
        label_schema_collection = mock_db.create_collection("label_schema")
        model_collection = mock_db.create_collection("model")
        model_storage_collection = mock_db.create_collection("model_storage")
        task_node_collection = mock_db.create_collection("task_node")
        annotation_scene_collection = mock_db.create_collection("annotation_scene")
        annotation_scene_state_collection = mock_db.create_collection("annotation_scene_state")

        project_collection.insert_one(project)
        label_collection.insert_one(label)
        label_schema_collection.insert_one(label_schema)
        model_collection.insert_one(model)
        model_storage_collection.insert_one(model_storage)
        task_node_collection.insert_one(task_node)
        annotation_scene_collection.insert_one(fxt_annotation_scene)
        annotation_scene_state_collection.insert_one(fxt_annotation_scene_state)

        # Act
        with patch.object(MongoClient, "get_database", return_value=mock_db):
            ReduceAnomalyTasksMigration.upgrade_project(
                organization_id=str(ORGANIZATION_ID),
                workspace_id=str(WORKSPACE_ID),
                project_id=str(PROJECT_ID),
            )

        # Check that the fields have been correctly reduced
        project_after_upgrade = list(project_collection.find(filter={"_id": PROJECT_ID}))
        assert project_after_upgrade[0]["project_type"] == "ANOMALY"
        assert project_after_upgrade[0]["task_graph"]["pipeline_representation"] == "Dataset → Anomaly"
        assert project_after_upgrade[0]["performance"]["task_performances"][0]["score"]["metric_type"] == "accuracy"
        assert not project_after_upgrade[0]["performance"]["task_performances"][0].get("global_score")
        assert not project_after_upgrade[0]["performance"]["task_performances"][0].get("local_score")

        labels_after_upgrade = list(label_collection.find(filter={"project_id": PROJECT_ID}))
        assert labels_after_upgrade[0]["domain"] == "ANOMALY"

        label_schema_after_upgrade = list(label_schema_collection.find(filter={"project_id": PROJECT_ID}))
        assert label_schema_after_upgrade[0]["label_groups"][0]["name"] == "default - anomaly"

        model_after_upgrade = list(model_collection.find(filter={"project_id": PROJECT_ID}))
        assert model_after_upgrade[0]["configuration"]["label_schema"]["label_groups"][0]["name"] == "default - anomaly"

        model_storage_after_upgrade = list(model_storage_collection.find(filter={"project_id": PROJECT_ID}))
        assert model_storage_after_upgrade[0]["model_template_id"] == "ote_anomaly_padim"

        task_node_after_upgrade = list(task_node_collection.find(filter={"project_id": PROJECT_ID}))
        assert task_node_after_upgrade[0]["task_type"] == "ANOMALY"
        assert task_node_after_upgrade[0]["task_title"] == "Anomaly"

        annotation_scene_after_upgrade = list(annotation_scene_collection.find(filter={"project_id": PROJECT_ID}))
        assert len(annotation_scene_after_upgrade[0]["annotations"]) == 1
        shape = annotation_scene_after_upgrade[0]["annotations"][0]["shape"]
        assert (
            shape["type"] == "RECTANGLE"
            and shape["x1"] == 0
            and shape["y1"] == 0
            and shape["x2"] == 1
            and shape["y2"] == 1
        )

        annotation_state_after_upgrade = list(annotation_scene_state_collection.find(filter={"project_id": PROJECT_ID}))
        assert annotation_state_after_upgrade[0]["media_annotation_state"] == "ANNOTATED"
        assert annotation_state_after_upgrade[0]["state_per_task"][0]["annotation_state"] == "ANNOTATED"
