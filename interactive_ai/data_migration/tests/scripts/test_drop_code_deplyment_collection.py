# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
from unittest.mock import patch

import mongomock
from bson import ObjectId
from pymongo import MongoClient
from pymongo.database import Database

from migration.scripts.drop_code_deployment_collection import DropCodeDeploymentCollectionMigration


class TestDropCodeDeploymentCollectionMigration:
    def test_drop_code_deployment_collection(self) -> None:
        # Arrange
        mock_db: Database = mongomock.MongoClient().db
        collection = mock_db.get_collection("code_deployment")
        doc = {
            "_id": ObjectId("66a360141ad051b7b6ab1939"),
            "project_id": ObjectId("66a0faf070cdf6d0b2ec5f93"),
        }
        collection.insert_one(doc)
        assert "code_deployment" in mock_db.list_collection_names()
        assert list(collection.find({}))

        # Act
        with patch.object(MongoClient, "get_database", return_value=mock_db):
            DropCodeDeploymentCollectionMigration.upgrade_non_project_data()

        # Assert
        assert "code_deployment" not in mock_db.list_collection_names()
        assert DropCodeDeploymentCollectionMigration.upgrade_non_project_data() is None
        collection = mock_db.get_collection("code_deployment")
        assert not list(collection.find({}))
