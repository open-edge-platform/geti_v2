# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
from http import HTTPStatus

from geti_types import CTX_SESSION_VAR


class TestModelRESTEndpoint:
    def test_supported_algorithms_endpoint_single_task(self, fxt_director_app, fxt_db_project_service) -> None:
        # Default templates are patched because these are unavailable on the testing environment
        session = CTX_SESSION_VAR.get()
        project = fxt_db_project_service.create_annotated_detection_project()
        workspace_id = project.workspace_id
        project_id = project.id_
        endpoint = (
            f"/api/v1/organizations/{str(session.organization_id)}"
            f"/workspaces/{workspace_id}"
            f"/projects/{project_id}"
            f"/supported_algorithms"
        )

        supported_algorithms = [
            {
                "model_manifest_id": "null",
                "task": "null",
                "name": "null",
                "description": "null",
                "stats": {
                    "gigaflops": 1.0,
                    "trainable_parameters": 1.0,
                    "performance_ratings": {"accuracy": 1, "training_time": 1, "inference_speed": 1},
                },
                "support_status": "obsolete",
                "supported_gpus": {},
                "capabilities": {"xai": False, "tiling": False},
                "is_default_model": False,
                "performance_category": "other",
            }
        ]

        result = fxt_director_app.get(endpoint)

        assert result.status_code == HTTPStatus.OK
        data = result.json()
        for item in data["supported_algorithms"]:
            assert item in supported_algorithms

    def test_supported_algorithms_endpoint_task_chain(self, fxt_director_app, fxt_db_project_service) -> None:
        # Default templates are patched because these are unavailable on the testing environment
        session = CTX_SESSION_VAR.get()
        project = fxt_db_project_service.create_annotated_detection_classification_project()
        workspace_id = project.workspace_id
        project_id = project.id_
        endpoint = (
            f"/api/v1/organizations/{str(session.organization_id)}"
            f"/workspaces/{workspace_id}"
            f"/projects/{project_id}"
            f"/supported_algorithms"
        )
        supported_algorithms = [
            {
                "model_manifest_id": "null",
                "task": "null",
                "name": "null",
                "description": "null",
                "stats": {
                    "gigaflops": 1.0,
                    "trainable_parameters": 1.0,
                    "performance_ratings": {"accuracy": 1, "training_time": 1, "inference_speed": 1},
                },
                "support_status": "obsolete",
                "supported_gpus": {},
                "capabilities": {"xai": False, "tiling": False},
                "is_default_model": False,
                "performance_category": "other",
            },
            {
                "model_manifest_id": "null",
                "task": "null",
                "name": "null",
                "description": "null",
                "stats": {
                    "gigaflops": 1.0,
                    "trainable_parameters": 1.0,
                    "performance_ratings": {"accuracy": 1, "training_time": 1, "inference_speed": 1},
                },
                "support_status": "obsolete",
                "supported_gpus": {},
                "capabilities": {"xai": False, "tiling": False},
                "is_default_model": False,
                "performance_category": "other",
            },
        ]
        result = fxt_director_app.get(endpoint)

        assert result.status_code == HTTPStatus.OK
        data = result.json()
        for item in data["supported_algorithms"]:
            assert item in supported_algorithms
