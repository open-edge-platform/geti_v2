# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
from collections.abc import Callable
from functools import partial
from unittest.mock import patch
from uuid import UUID

import mongomock
import pytest
from bson import ObjectId
from pymongo import MongoClient
from pymongo.database import Database

from migration.scripts.remove_premature_configuration import RemovePrematureConfigurationMigration
from migration.utils import MongoDBConnection


class TestRemovePrematureConfigurationMigration:
    @pytest.mark.parametrize("collection_exists", [True, False], ids=["existing", "non-existing"])
    def test_upgrade_non_project_data(self, collection_exists) -> None:
        def drop_collection_with_return(collection_name: str, original_fn: Callable):
            # wrapper around mongomock.Database.drop_collection that returns info, like the pymongo method does
            original_fn(collection_name)
            return {"ok": 1.0}

        mock_db: Database = mongomock.MongoClient(uuidRepresentation="standard").db
        if collection_exists:
            mock_db.create_collection("project_configuration")
            mock_db.create_collection("training_configuration")
            assert "project_configuration" in mock_db.list_collection_names()
            assert "training_configuration" in mock_db.list_collection_names()
        else:
            assert "project_configuration" not in mock_db.list_collection_names()
            assert "training_configuration" not in mock_db.list_collection_names()

        with (
            patch.object(MongoClient, "get_database", return_value=mock_db),
            patch.object(
                mock_db,
                "drop_collection",
                new=partial(drop_collection_with_return, original_fn=mock_db.drop_collection),
            ),
        ):
            RemovePrematureConfigurationMigration.upgrade_non_project_data()

        assert "project_configuration" not in mock_db.list_collection_names()
        assert "training_configuration" not in mock_db.list_collection_names()

    @pytest.mark.parametrize("collection_exists", [True, False], ids=["existing", "non-existing"])
    def test_upgrade_project(self, collection_exists, request) -> None:
        def cleanup():
            # Remove the documents added during the test
            project_config_collection.delete_many({})
            training_config_collection.delete_many({})

        database = MongoDBConnection().client["geti"]
        request.addfinalizer(cleanup)
        project_config_collection = database.get_collection("project_configuration")
        training_config_collection = database.get_collection("training_configuration")
        organization_id = UUID("11fdb5ad-8e0d-4301-b22b-06589beef658")
        workspace_id = UUID("11fdb5ad-8e0d-4301-b22b-06589beef658")
        project_id = ObjectId("66a0faf070cdf6d0b2ec5f93")
        filter_query = {"organization_id": organization_id, "workspace_id": workspace_id, "project_id": project_id}

        if collection_exists:
            project_config_collection.insert_one(
                {
                    "organization_id": organization_id,
                    "workspace_id": workspace_id,
                    "project_id": project_id,
                    "auto_training": {
                        "min_annotation_per_label": 0,
                    },
                }
            )
            training_config_collection.insert_one(
                {
                    "organization_id": organization_id,
                    "workspace_id": workspace_id,
                    "project_id": project_id,
                    "name": "dummy_training_configuration",
                }
            )
            assert project_config_collection.count_documents(filter_query) == 1
            assert training_config_collection.count_documents(filter_query) == 1

        RemovePrematureConfigurationMigration.upgrade_project(
            organization_id=str(organization_id), workspace_id=str(workspace_id), project_id=str(project_id)
        )

        assert project_config_collection.count_documents(filter_query) == 0
        assert training_config_collection.count_documents(filter_query) == 0
