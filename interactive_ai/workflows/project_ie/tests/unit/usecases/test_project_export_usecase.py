# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
import contextlib
import os.path
import shutil
from unittest.mock import ANY, MagicMock, Mock, patch

from geti_types import CTX_SESSION_VAR, ID, Session
from iai_core.repos.base import SessionBasedRepo
from iai_core.repos.storage.storage_client import BinaryObjectType
from iai_core.versioning import DataVersion

from job.entities.zip_archive import ProjectZipArchive, ProjectZipArchiveWrapper
from job.repos import BinaryStorageRepo, DocumentRepo, ZipStorageRepo
from job.usecases import ExportDataRedactionUseCase, ProjectExportUseCase, SignatureUseCaseHelper


def do_nothing(*args, **kwargs):
    pass


def identity_map(self, x):
    return x


class TestProjectExportUseCase:
    def test_export_as_zip(self, request, fxt_ote_id) -> None:
        def mocked_upload_downloadable_archive(self, operation_id: ID, zip_local_path: str):
            shutil.move(zip_local_path, exported_zip_path)

        def mocked_progress_callback(progress: float, message: str) -> None:
            mocked_progress(progress, message)

        dummy_signature_bytes = b"dummy_signature_bytes"
        mocked_signing_use_case = MagicMock()
        mocked_signing_use_case.public_key_bytes = b"dummy_public_key_data"
        mocked_signing_use_case.generate_signature.return_value = dummy_signature_bytes
        mocked_progress = MagicMock()
        project_id = fxt_ote_id(1)
        export_id = fxt_ote_id(1000)
        exported_zip_path = "test_project_archive.zip"
        session: Session = CTX_SESSION_VAR.get()
        download_url = (
            f"api/v1/organizations/{session.organization_id}/workspaces/{session.workspace_id}/"
            f"projects/{project_id}/exports/{export_id}/download"
        )
        # Python has a limit of 20 statically nested blocks ('with' statements); to override this limitation,
        # some of the mocks are applied dynamically with "enter_context()"
        mocks = [
            patch.object(SessionBasedRepo, "generate_id", return_value=export_id),
            patch.object(BinaryStorageRepo, "__init__", new=do_nothing),
            patch.object(
                BinaryStorageRepo,
                "get_all_objects_by_type",
                return_value=[("local_path_1", "remote_path_1")],
            ),
            patch.object(ZipStorageRepo, "__init__", new=do_nothing),
            patch.object(
                ZipStorageRepo,
                "upload_downloadable_archive",
                new=mocked_upload_downloadable_archive,
            ),
            patch.object(
                DocumentRepo,
                "get_all_documents_from_db_for_collection",
                return_value=[{"key1": "value1"}],
            ),
            patch.object(DocumentRepo, "get_collection_names", return_value=("collection_1",)),
            patch.object(
                ExportDataRedactionUseCase,
                "remove_container_info_in_mongodb_doc",
                new=identity_map,
            ),
            patch.object(
                ExportDataRedactionUseCase,
                "remove_job_id_in_mongodb_doc",
                new=identity_map,
            ),
            patch.object(
                ExportDataRedactionUseCase,
                "remove_lock_in_mongodb_doc",
                new=identity_map,
            ),
            patch.object(
                ExportDataRedactionUseCase,
                "replace_objectid_in_mongodb_doc",
                new=identity_map,
            ),
            patch.object(
                ExportDataRedactionUseCase,
                "replace_objectid_based_binary_filename_in_mongodb_doc",
                new=identity_map,
            ),
            patch.object(ExportDataRedactionUseCase, "replace_objectid_in_url", new=identity_map),
            patch.object(ExportDataRedactionUseCase, "replace_objectid_in_file", new=identity_map),
            patch.object(
                ExportDataRedactionUseCase,
                "mask_user_info_in_mongodb_doc",
                new=identity_map,
            ),
            patch.object(
                ExportDataRedactionUseCase,
                "objectid_replacement_min_id",
                return_value="00000000000000000000000f",
            ),
            patch.object(
                SignatureUseCaseHelper,
                "get_signature_use_case",
                return_value=mocked_signing_use_case,
            ),
        ]
        with (
            contextlib.ExitStack() as stack,
            patch.object(ProjectZipArchive, "add_collection_with_documents") as mock_add_collection,
            patch.object(ProjectZipArchive, "add_objects_by_type") as mock_add_objects,
            patch.object(ProjectZipArchive, "add_manifest") as mock_add_manifest,
            patch.object(ProjectZipArchiveWrapper, "add_signature") as mock_add_signature,
            patch.object(ProjectZipArchiveWrapper, "add_public_key") as mock_add_public_key,
            patch.object(DataVersion, "get_current", return_value=DataVersion("1.0")) as mock_get_version,
            patch("job.usecases.project_export_usecase.publish_metadata_update") as mock_metadata_update,
        ):
            for m in mocks:
                stack.enter_context(m)
            ProjectExportUseCase.export_as_zip(
                project_id=project_id,
                include_models="all",
                progress_callback=mocked_progress_callback,
            )

        request.addfinalizer(lambda: os.remove(exported_zip_path))
        mock_add_collection.assert_called_once_with(collection_name="collection_1", documents=ANY)
        mock_add_objects.assert_called()
        mock_get_version.assert_called_once_with()
        mock_add_manifest.assert_called_once_with(version="1.0", min_id=ANY)
        mocked_progress.assert_called()
        assert os.path.exists(exported_zip_path)
        mock_metadata_update.assert_called_once_with(metadata={"download_url": download_url, "size": 0})
        mock_add_signature.assert_called_once_with(signature=dummy_signature_bytes)
        mock_add_public_key.assert_called_once_with(public_key=mocked_signing_use_case.public_key_bytes)

    @patch("job.usecases.project_export_usecase.tempfile.TemporaryDirectory")
    @patch("job.usecases.project_export_usecase.ProjectExportUseCase._ProjectExportUseCase__export_as_zip")
    def test_export_as_zip_with_include_models_none(self, mock_export_as_zip, mock_temp_dir) -> None:
        """Test that export_as_zip properly handles include_models='none'"""
        mock_temp_dir_context = Mock()
        mock_temp_dir_context.__enter__ = Mock(return_value="/tmp/test_dir")
        mock_temp_dir_context.__exit__ = Mock(return_value=None)
        mock_temp_dir.return_value = mock_temp_dir_context

        project_id = "test_project_id"
        include_models = "none"
        progress_callback = Mock()

        ProjectExportUseCase.export_as_zip(
            project_id=project_id, include_models=include_models, progress_callback=progress_callback
        )

        mock_export_as_zip.assert_called_once_with(
            project_id=project_id,
            include_models="none",
            tmp_folder="/tmp/test_dir",
            progress_callback=progress_callback,
        )

    @patch("job.usecases.project_export_usecase.CTX_SESSION_VAR")
    @patch("job.usecases.project_export_usecase.DocumentRepo")
    @patch("job.usecases.project_export_usecase.BinaryStorageRepo")
    @patch("job.usecases.project_export_usecase.ZipStorageRepo")
    @patch("job.usecases.project_export_usecase.ProjectZipArchive")
    @patch("job.usecases.project_export_usecase.ProjectZipArchiveWrapper")
    @patch("job.usecases.project_export_usecase.ExportDataRedactionUseCase")
    @patch("job.usecases.project_export_usecase.SignatureUseCaseHelper")
    @patch("job.usecases.project_export_usecase.read_file_in_chunks")
    @patch("job.usecases.project_export_usecase.publish_metadata_update")
    def test_export_as_zip_include_models_none_purges_models_and_skips_binaries(
        self,
        mock_publish_metadata,
        mock_read_file,
        mock_signature_helper,
        mock_redaction_usecase,
        mock_wrapper_archive,
        mock_zip_archive,
        mock_zip_storage_repo,
        mock_binary_storage_repo,
        mock_document_repo,
        mock_session_var,
    ) -> None:
        """Test that include_models='none' purges model documents and skips model binaries"""
        # Setup mocks
        mock_session = Mock()
        mock_session.workspace_id = "workspace_id"
        mock_session.organization_id = "org_id"
        mock_session_var.get.return_value = mock_session

        mock_doc_repo_instance = Mock()
        mock_document_repo.return_value = mock_doc_repo_instance
        mock_doc_repo_instance.get_collection_names.return_value = ["model", "other_collection"]
        mock_doc_repo_instance.get_all_documents_from_db_for_collection.return_value = [{"_id": "doc1"}]

        mock_binary_repo_instance = Mock()
        mock_binary_storage_repo.return_value = mock_binary_repo_instance
        mock_binary_repo_instance.get_object_types.return_value = [BinaryObjectType.MODELS, BinaryObjectType.MEDIA]
        mock_binary_repo_instance.get_all_objects_by_type.return_value = [("local_path", "remote_path")]

        mock_zip_storage_instance = Mock()
        mock_zip_storage_repo.return_value = mock_zip_storage_instance

        mock_redaction_instance = Mock()
        mock_redaction_usecase.return_value = mock_redaction_instance
        mock_redaction_instance.purge_model_docs_if_necessary = Mock(return_value={"_id": "purged_doc"})
        mock_redaction_instance.objectid_replacement_min_id = "min_id"

        mock_zip_archive_instance = Mock()
        mock_zip_archive_instance.__enter__ = Mock(return_value=mock_zip_archive_instance)
        mock_zip_archive_instance.__exit__ = Mock(return_value=None)
        mock_zip_archive_instance.get_compressed_size.return_value = 1024
        mock_zip_archive.return_value = mock_zip_archive_instance

        mock_wrapper_instance = Mock()
        mock_wrapper_instance.__enter__ = Mock(return_value=mock_wrapper_instance)
        mock_wrapper_instance.__exit__ = Mock(return_value=None)
        mock_wrapper_archive.return_value = mock_wrapper_instance

        mock_signature_use_case = Mock()
        mock_signature_use_case.generate_signature.return_value = "signature"
        mock_signature_use_case.public_key_bytes = b"public_key"
        mock_signature_helper.get_signature_use_case.return_value = mock_signature_use_case

        # Call the method
        ProjectExportUseCase._ProjectExportUseCase__export_as_zip(
            project_id="test_project", tmp_folder="/tmp/test", include_models="none", progress_callback=Mock()
        )

        # Verify that purge_model_docs_if_necessary was called for model collection
        mock_redaction_instance.purge_model_docs_if_necessary.assert_called()

        # Verify that get_all_objects_by_type was called for both object types
        mock_binary_repo_instance.get_all_objects_by_type.assert_any_call(
            object_type=BinaryObjectType.MEDIA, target_folder="/tmp/test"
        )
        # Verify that MODELS object type was NOT processed (skipped due to include_models="none")
        models_calls = [
            call
            for call in mock_binary_repo_instance.get_all_objects_by_type.call_args_list
            if call[1]["object_type"] == BinaryObjectType.MODELS
        ]
        assert len(models_calls) == 0

        # Verify zip archive operations were called
        mock_zip_archive_instance.add_collection_with_documents.assert_called()
        mock_zip_archive_instance.add_objects_by_type.assert_called()
        mock_zip_archive_instance.add_manifest.assert_called()
