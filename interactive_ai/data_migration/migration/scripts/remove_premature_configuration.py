# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
import logging
from uuid import UUID

from bson import ObjectId
from pymongo.collection import Collection
from pymongo.database import Database

from migration.utils import IMigrationScript, MongoDBConnection

logger = logging.getLogger(__name__)


PROJECT_CONFIGURATION = "project_configuration"
TRAINING_CONFIGURATION = "training_configuration"


class RemovePrematureConfigurationMigration(IMigrationScript):
    @classmethod
    def upgrade_non_project_data(cls) -> None:
        """Drop the 'project_configuration' and 'training_configuration' collections."""
        db = MongoDBConnection().geti_db
        cls._drop_collection(db, PROJECT_CONFIGURATION)
        cls._drop_collection(db, TRAINING_CONFIGURATION)

    @staticmethod
    def _drop_collection(database: Database, collection_name: str) -> None:
        ret = database.drop_collection(collection_name)
        if ret["ok"]:
            logger.info(f"Dropped collection '{collection_name}'")
        else:
            logger.warning(f"Collection to drop not found: '{collection_name}'")

    @classmethod
    def upgrade_project(cls, organization_id: str, workspace_id: str, project_id: str) -> None:
        """Delete all documents from the project and training configuration collections contained in a project."""
        db = MongoDBConnection().geti_db
        preliminary_filter_query = {
            "organization_id": UUID(organization_id),
            "workspace_id": UUID(workspace_id),
            "project_id": ObjectId(project_id),
        }
        project_configuration_collection = db.get_collection(PROJECT_CONFIGURATION)
        training_configuration_collection = db.get_collection(TRAINING_CONFIGURATION)
        cls._delete_all(collection=project_configuration_collection, query=preliminary_filter_query)
        cls._delete_all(collection=training_configuration_collection, query=preliminary_filter_query)

    @staticmethod
    def _delete_all(collection: Collection, query: dict) -> None:
        """Delete all documents from the collection that match the query."""
        result = collection.delete_many(query)
        if result.deleted_count > 0:
            logger.info(f"Deleted {result.deleted_count} documents from collection '{collection.name}'.")

    @classmethod
    def downgrade_project(cls, organization_id: str, workspace_id: str, project_id: str) -> None:
        """No action required"""

    @classmethod
    def downgrade_non_project_data(cls) -> None:
        """No action required"""
