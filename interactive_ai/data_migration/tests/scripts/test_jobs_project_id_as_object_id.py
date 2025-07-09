# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
from unittest.mock import patch

import pytest
from bson import ObjectId
from pymongo import MongoClient

from migration.scripts.jobs_project_id_as_object_id import JobsProjectIdAsObjectId
from migration.utils import MongoDBConnection

PROJECT_STRING_ID = "662c1c6b3a3df3291394b158"
PROJECT_OBJECT_ID = ObjectId(PROJECT_STRING_ID)
PROJECT_ID = ObjectId("662c1c6b3a3df3291394b164")
ID_1 = ObjectId("662c1c6b3a3df3291394b161")
ID_2 = ObjectId("662c1c6b3a3df3291394b162")
ID_3 = ObjectId("662c1c6b3a3df3291394b163")


@pytest.fixture
def fxt_mongo_client() -> MongoClient:
    return MongoDBConnection().client


@pytest.fixture
def fxt_list_of_job_data() -> list[dict]:
    return [
        {
            "_id": ID_1,
            "project_id": PROJECT_STRING_ID,
        },
        {
            "_id": ID_2,
            "project_id": PROJECT_ID,
        },
        {
            "_id": ID_3,
        },
    ]


@pytest.fixture
def fxt_list_of_job_downgrade_data() -> list[dict]:
    return [
        {
            "_id": ID_1,
            "project_id": PROJECT_STRING_ID,
        },
        {
            "_id": ID_2,
            "project_id": str(PROJECT_ID),
        },
        {
            "_id": ID_3,
        },
    ]


@pytest.fixture
def fxt_list_of_job_data_expected() -> list[dict]:
    return [
        {
            "_id": ID_1,
            "project_id": PROJECT_OBJECT_ID,
        },
        {
            "_id": ID_2,
            "project_id": PROJECT_ID,
        },
        {
            "_id": ID_3,
        },
    ]


class TestAddProjectTypeMigration:
    def test_upgrade_non_project_data(
        self,
        request,
        fxt_list_of_job_data,
        fxt_list_of_job_data_expected,
        fxt_mongo_client,
    ) -> None:
        # Arrange
        mock_db = fxt_mongo_client.get_database("geti_test")
        request.addfinalizer(lambda: fxt_mongo_client.drop_database("geti_test"))
        job_collection = mock_db.job
        for doc in fxt_list_of_job_data:
            job_collection.insert_one(doc)

        # Act
        with patch.object(MongoClient, "get_database", return_value=mock_db):
            JobsProjectIdAsObjectId.upgrade_non_project_data()

        # Assert
        new_docs = list(job_collection.find())
        assert len(new_docs) == 3
        assert new_docs == fxt_list_of_job_data_expected

    def test_downgrade_non_project_data(
        self,
        request,
        fxt_list_of_job_downgrade_data,
        fxt_list_of_job_data_expected,
        fxt_mongo_client,
    ) -> None:
        # Arrange
        mock_db = fxt_mongo_client.get_database("geti_test")
        request.addfinalizer(lambda: fxt_mongo_client.drop_database("geti_test"))
        job_collection = mock_db.job
        for doc in fxt_list_of_job_data_expected:
            job_collection.insert_one(doc)

        # Act
        with patch.object(MongoClient, "get_database", return_value=mock_db):
            JobsProjectIdAsObjectId.downgrade_non_project_data()

        # Assert
        new_docs = list(job_collection.find())
        assert len(new_docs) == 3
        assert new_docs == fxt_list_of_job_downgrade_data
