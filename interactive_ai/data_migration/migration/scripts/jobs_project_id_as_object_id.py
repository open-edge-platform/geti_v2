# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
import logging

from bson import ObjectId

from migration.utils import IMigrationScript, MongoDBConnection

logger = logging.getLogger(__name__)


class JobsProjectIdAsObjectId(IMigrationScript):
    @classmethod
    def upgrade_project(cls, organization_id: str, workspace_id: str, project_id: str) -> None:
        """
        Job documents are not exported or imported.
        """

    @classmethod
    def downgrade_project(cls, organization_id: str, workspace_id: str, project_id: str) -> None:
        """
        Job documents are not exported or imported.
        """

    @classmethod
    def upgrade_non_project_data(cls) -> None:
        """
        Replace project id strings in job docuemnts with object ids
        """
        db = MongoDBConnection().geti_db
        job_collection = db.get_collection("job")
        docs = job_collection.find(
            {
                "project_id": {"$type": "string"},
            }
        )
        for doc in docs:
            project_string_id = doc["project_id"]
            job_collection.find_one_and_update(
                filter={
                    "_id": doc["_id"],
                },
                update={"$set": {"project_id": ObjectId(project_string_id)}},
            )

    @classmethod
    def downgrade_non_project_data(cls) -> None:
        """
        Replace project object id in job docuemnts with string ids
        """
        db = MongoDBConnection().geti_db
        job_collection = db.get_collection("job")
        docs = job_collection.find(
            {
                "project_id": {"$type": "objectId"},
            }
        )
        for doc in docs:
            project_object_id = doc["project_id"]
            job_collection.find_one_and_update(
                filter={
                    "_id": doc["_id"],
                },
                update={"$set": {"project_id": str(project_object_id)}},
            )
