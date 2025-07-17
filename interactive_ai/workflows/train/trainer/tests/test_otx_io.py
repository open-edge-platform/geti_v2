# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
from pathlib import Path
from unittest.mock import MagicMock, call, patch

import pytest
from otx_io import (
    download_config_file,
    download_model_artifact,
    download_shard_files,
    load_trained_model_weights,
    save_checkpoint_sync,
    save_exported_model,
    save_openvino_exported_model,
    save_trained_model_weights,
    upload_error_log,
    upload_full_log,
    upload_model_artifact,
)
from s3_client import S3ClientSingleton
from utils import ExportFormat, ExportParameter, PrecisionType


def mock_client(self, *args, **kwargs) -> None:
    self.client = MagicMock()
    self.presigned_urls_client = MagicMock()
    return


@patch.object(S3ClientSingleton, "instance")
@patch("otx_io._get_shard_files_dir", return_value=Path("shard_files"))
@patch("otx_io._get_object_name_base", return_value=Path("object_name_base"))
@patch("otx_io._get_bucket_name", return_value="bucket")
def test_download_shard_files(
    mock_get_bucket_name,
    mock_get_object_name_base,
    mock_get_shard_files_dir,
    mock_s3_client,
) -> None:
    # Arrange
    client = MagicMock()
    mock_s3_client.return_value = client

    file = MagicMock()
    file.is_dir = False
    file.object_name = "datum-1-of-1.arrow"
    client.list_files.return_value = [file]

    client.get_presigned_url.return_value = "presigned_url"

    # Act
    result = download_shard_files()

    # Assert
    mock_get_bucket_name.assert_called()
    mock_get_object_name_base.assert_called()
    mock_get_shard_files_dir.assert_called()
    client.list_files.assert_called_once_with(
        bucket_name="bucket", relative_path=Path("object_name_base/inputs"), recursive=True
    )
    client.download_file.assert_called_once_with(
        bucket_name="bucket",
        relative_path=Path("object_name_base/inputs/datum-1-of-1.arrow"),
        file_path=Path("shard_files/datum-1-of-1.arrow"),
    )
    assert result == Path("shard_files")


@patch.object(S3ClientSingleton, "instance")
@patch("otx_io._get_shard_files_dir", return_value=Path("shard_files"))
@patch("otx_io._get_object_name_base", return_value=Path("object_name_base"))
@patch("otx_io._get_bucket_name", return_value="bucket")
def test_download_config_file(
    mock_get_bucket_name, mock_get_object_name_base, mock_get_shard_files_dir, mock_s3_client
) -> None:
    # Arrange
    client = MagicMock()
    mock_s3_client.return_value = client

    # Act
    download_config_file()

    # Assert
    mock_get_bucket_name.assert_called()
    mock_get_object_name_base.assert_called()
    mock_get_shard_files_dir.assert_called()
    client.download_file.assert_called_once_with(
        bucket_name="bucket",
        relative_path=Path("object_name_base/inputs/config.json"),
        file_path=Path("shard_files/config.json"),
    )


@pytest.mark.parametrize("force_non_xai", [True, False])
@patch.object(S3ClientSingleton, "instance")
@patch.object(Path, "open")
@patch("otx_io.TemporaryDirectory")
@patch("otx_io._get_object_name_base", return_value=Path("object_name_base"))
@patch("otx_io._get_bucket_name", return_value="bucket")
def test_save_checkpoint_sync(
    mock_get_bucket_name,
    mock_get_object_name_base,
    mock_temp_dir,
    mock_open,
    mock_s3_client,
    force_non_xai,
) -> None:
    # Arrange
    client = MagicMock()
    mock_s3_client.return_value = client

    dir = MagicMock()
    dir.__enter__.return_value = "temp"
    mock_temp_dir.return_value = dir

    mock_open.return_value = MagicMock()

    # Act
    save_checkpoint_sync(model_weights_reader=MagicMock(), force_non_xai=force_non_xai)

    # Assert
    mock_get_bucket_name.assert_called()
    mock_get_object_name_base.assert_called()
    filename = "model_fp32_non-xai.pth" if force_non_xai else "model_fp32_xai.pth"
    client.upload_file_from_local_disk.assert_called_once_with(
        bucket_name="bucket",
        relative_path=Path("object_name_base/outputs/models") / filename,
        local_file_path=Path("temp") / filename,
    )


@patch.object(S3ClientSingleton, "instance")
@patch("otx_io._get_object_name_base", return_value=Path("object_name_base"))
@patch("otx_io._get_bucket_name", return_value="bucket")
def test_upload_error_log(
    mock_get_bucket_name,
    mock_get_object_name_base,
    mock_s3_client,
) -> None:
    # Arrange
    client = MagicMock()
    mock_s3_client.return_value = client

    # Act
    upload_error_log(Exception())

    # Assert
    mock_get_bucket_name.assert_called()
    mock_get_object_name_base.assert_called()
    client.upload_file_from_bytes.assert_called_once_with(
        bucket_name="bucket",
        relative_path=Path("object_name_base/outputs/logs/error.json"),
        input_bytes=b'{"exc_type": "Exception", "message": "", "traceback": "NoneType: None\\n"}',
        overwrite=True,
    )


@patch.object(S3ClientSingleton, "instance")
@patch("otx_io._get_object_name_base", return_value=Path("object_name_base"))
@patch("otx_io._get_bucket_name", return_value="bucket")
def test_upload_full_log(
    mock_get_bucket_name,
    mock_get_object_name_base,
    mock_s3_client,
) -> None:
    # Arrange
    client = MagicMock()
    mock_s3_client.return_value = client

    # Act
    upload_full_log("Full log")

    # Assert
    mock_get_bucket_name.assert_called()
    mock_get_object_name_base.assert_called()
    client.upload_file_from_bytes.assert_called_once_with(
        bucket_name="bucket",
        relative_path=Path("object_name_base/outputs/logs/otx-full.log"),
        input_bytes=b"Full log",
        overwrite=True,
    )


@patch.object(S3ClientSingleton, "instance")
@patch("otx_io._get_object_name_base", return_value=Path("object_name_base"))
@patch("otx_io._get_bucket_name", return_value="bucket")
def test_upload_model_artifact(
    mock_get_bucket_name,
    mock_get_object_name_base,
    mock_s3_client,
) -> None:
    # Arrange
    client = MagicMock()
    mock_s3_client.return_value = client

    # Act
    upload_model_artifact(src_filepath=Path("src_filepath"), dst_filepath=Path("dst_filepath"))

    # Assert
    mock_get_bucket_name.assert_called()
    mock_get_object_name_base.assert_called()
    client.upload_file_from_local_disk.assert_called_once_with(
        bucket_name="bucket",
        relative_path=Path("object_name_base/dst_filepath"),
        local_file_path=Path("src_filepath"),
    )


@patch.object(S3ClientSingleton, "instance")
@patch("otx_io._get_object_name_base", return_value=Path("object_name_base"))
@patch("otx_io._get_bucket_name", return_value="bucket")
def test_download_model_artifact_destination_not_dir(
    mock_get_bucket_name,
    mock_get_object_name_base,
    mock_s3_client,
) -> None:
    # Arrange
    client = MagicMock()
    mock_s3_client.return_value = client

    dst_dir_path = MagicMock()
    dst_dir_path.is_dir.return_value = False

    # Act
    with pytest.raises(ValueError):
        download_model_artifact(src_path=Path("src_path"), dst_dir_path=dst_dir_path, use_presigned_url=True)

    # Assert
    mock_get_bucket_name.assert_not_called()
    mock_get_object_name_base.assert_not_called()
    client.get_presigned_url.assert_not_called()
    client.download_file.assert_not_called()


@patch.object(S3ClientSingleton, "instance")
@patch("builtins.open")
@patch("otx_io.requests.get")
@patch("otx_io._get_object_name_base", return_value=Path("object_name_base"))
@patch("otx_io._get_bucket_name", return_value="bucket")
def test_download_model_artifact_presigned(
    mock_get_bucket_name,
    mock_get_object_name_base,
    mock_requests_get,
    mock_open,
    mock_s3_client,
) -> None:
    # Arrange
    client = MagicMock()
    mock_s3_client.return_value = client

    dst_dir_path = MagicMock()
    dst_dir_path.is_dir.return_value = True
    dst_dir_path.__truediv__.return_value = Path("destination_path")

    client.get_presigned_url.return_value = "presigned_url"

    mock_requests_get.return_value = MagicMock()

    # Act
    download_model_artifact(src_path=Path("artifact_name"), dst_dir_path=dst_dir_path, use_presigned_url=True)

    # Assert
    mock_get_bucket_name.assert_called()
    mock_get_object_name_base.assert_called()
    client.get_presigned_url.assert_called_once_with(
        bucket_name="bucket", relative_path=Path("object_name_base/artifact_name")
    )
    mock_open.assert_called_once_with(Path("destination_path"), "wb")
    mock_requests_get.assert_called_once_with("presigned_url", timeout=300, stream=False)


@patch.object(S3ClientSingleton, "instance")
@patch("otx_io._get_object_name_base", return_value=Path("object_name_base"))
@patch("otx_io._get_bucket_name", return_value="bucket")
def test_download_model_artifact_not_presigned(
    mock_get_bucket_name,
    mock_get_object_name_base,
    mock_s3_client,
) -> None:
    # Arrange
    client = MagicMock()
    mock_s3_client.return_value = client

    dst_dir_path = MagicMock()
    dst_dir_path.is_dir.return_value = True
    dst_dir_path.__truediv__.return_value = Path("destination_path")

    # Act
    download_model_artifact(src_path=Path("artifact_name"), dst_dir_path=dst_dir_path, use_presigned_url=False)

    # Assert
    mock_get_bucket_name.assert_called()
    mock_get_object_name_base.assert_called()
    client.download_file.assert_called_once_with(
        bucket_name="bucket", relative_path=Path("object_name_base/artifact_name"), file_path=Path("destination_path")
    )


@patch("otx_io.save_exported_model")
@patch("otx_io.unzip_exportable_code")
def test_save_openvino_exported_model(
    mock_unzip_exportable_code,
    mock_save_exported_model,
) -> None:
    # Arrange
    export_param = MagicMock()

    # Act
    save_openvino_exported_model(
        work_dir=Path("work_dir"),
        export_param=export_param,
        exported_path=Path("exported_path"),
        export_dir=Path("export_dir"),
    )

    # Assert
    mock_unzip_exportable_code.assert_called_once_with(
        work_dir=Path("work_dir"),
        exported_path=Path("exported_path"),
        dst_dir=Path("export_dir"),
    )
    mock_save_exported_model.assert_called_once_with(
        export_dir=Path("export_dir"),
        export_param=export_param,
    )


@pytest.mark.parametrize("force_non_xai", [True, False])
@patch("otx_io.upload_model_artifact")
def test_save_trained_model_weights(
    mock_upload_model_artifact,
    force_non_xai,
) -> None:
    # Arrange

    # Act
    save_trained_model_weights(
        best_checkpoint=Path("best_checkpoint"),
        force_non_xai=force_non_xai,
    )

    # Assert
    filename = "model_fp32_xai.pth" if not force_non_xai else "model_fp32_non-xai.pth"
    mock_upload_model_artifact.assert_called_once_with(
        src_filepath=Path("best_checkpoint"),
        dst_filepath=Path("outputs/models") / filename,
    )


@pytest.mark.parametrize("precision", [PrecisionType.FP32, PrecisionType.FP16, PrecisionType.INT8])
@pytest.mark.parametrize("with_xai", [True, False])
@patch("otx_io.upload_model_artifact")
def test_save_exported_model_base(
    mock_upload_model_artifact,
    precision,
    with_xai,
) -> None:
    # Arrange

    # Act
    with pytest.raises(ValueError):
        save_exported_model(
            export_dir=Path("export_dir"),
            export_param=ExportParameter(
                export_format=ExportFormat.BASE_FRAMEWORK, precision=precision, with_xai=with_xai
            ),
        )

    # Assert
    mock_upload_model_artifact.assert_not_called()


@pytest.mark.parametrize("precision", [PrecisionType.FP32, PrecisionType.FP16, PrecisionType.INT8])
@pytest.mark.parametrize("with_xai", [True, False])
@patch("os.remove")
@patch("otx_io.upload_model_artifact")
def test_save_exported_model_openvino(
    mock_upload_model_artifact,
    mock_remove,
    precision,
    with_xai,
) -> None:
    # Arrange
    export_param = ExportParameter(export_format=ExportFormat.OPENVINO, precision=precision, with_xai=with_xai)

    # Act
    save_exported_model(export_dir=Path("export_dir"), export_param=export_param)

    # Assert
    assert mock_upload_model_artifact.call_count == 3
    mock_upload_model_artifact.assert_has_calls(
        [
            call(
                src_filepath=Path("export_dir/exportable_code.zip"),
                dst_filepath=Path("outputs/exportable_codes") / export_param.to_exportable_code_artifact_fname(),
            ),
            call(
                src_filepath=Path("export_dir/exported_model.bin"),
                dst_filepath=Path("outputs/models") / export_param.to_artifact_fnames()[0],
            ),
            call(
                src_filepath=Path("export_dir/exported_model.xml"),
                dst_filepath=Path("outputs/models") / export_param.to_artifact_fnames()[1],
            ),
        ]
    )

    assert mock_remove.call_count == 3
    mock_remove.assert_has_calls(
        [
            call(Path("export_dir/exportable_code.zip")),
            call(Path("export_dir/exported_model.bin")),
            call(Path("export_dir/exported_model.xml")),
        ]
    )


@pytest.mark.parametrize("precision", [PrecisionType.FP32, PrecisionType.FP16, PrecisionType.INT8])
@pytest.mark.parametrize("with_xai", [True, False])
@patch("otx_io.upload_model_artifact")
def test_save_exported_model_onnx(
    mock_upload_model_artifact,
    precision,
    with_xai,
) -> None:
    # Arrange
    export_param = ExportParameter(export_format=ExportFormat.ONNX, precision=precision, with_xai=with_xai)

    # Act
    save_exported_model(export_dir=Path("export_dir"), export_param=export_param)

    # Assert
    mock_upload_model_artifact.assert_called_once_with(
        src_filepath=Path("export_dir/exported_model.onnx"),
        dst_filepath=Path("outputs/models") / export_param.to_artifact_fnames()[0],
    )


@pytest.mark.parametrize("optimize", [True, False])
@patch.object(S3ClientSingleton, "instance")
@patch("otx_io._get_object_name_base", return_value=Path("object_name_base"))
@patch("otx_io._get_bucket_name", return_value="bucket")
def test_load_trained_model_weights_from_scratch(
    mock_get_bucket_name,
    mock_get_object_name_base,
    mock_s3_client,
    optimize,
) -> None:
    # Arrange
    client = MagicMock()
    mock_s3_client.return_value = client
    client.list_files.return_value = []

    # Act
    result = load_trained_model_weights(work_dir=Path("work_dir"), optimize=optimize)

    # Assert
    assert result is None
    mock_get_bucket_name.assert_called()
    mock_get_object_name_base.assert_called()
    client.list_files.assert_called_once_with(bucket_name="bucket", relative_path=Path("object_name_base/inputs"))


@pytest.mark.parametrize("optimize", [True, False])
@patch.object(S3ClientSingleton, "instance")
@patch("otx_io.download_model_artifact", return_value=Path("downloaded"))
@patch("otx_io._get_object_name_base", return_value=Path("object_name_base"))
@patch("otx_io._get_bucket_name", return_value="bucket")
def test_load_trained_model_weights(
    mock_get_bucket_name,
    mock_get_object_name_base,
    mock_download_model_artifact,
    mock_s3_client,
    optimize,
) -> None:
    # Arrange
    client = MagicMock()
    mock_s3_client.return_value = client
    if optimize:
        client.list_files.return_value = [MagicMock(object_name="openvino.bin"), MagicMock(object_name="openvino.xml")]
    else:
        client.list_files.return_value = [MagicMock(object_name="model.pth")]

    # Act
    result = load_trained_model_weights(work_dir=Path("work_dir"), optimize=optimize)

    # Assert
    assert result == Path("downloaded")
    mock_get_bucket_name.assert_called()
    mock_get_object_name_base.assert_called()
    client.list_files.assert_called_once_with(bucket_name="bucket", relative_path=Path("object_name_base/inputs"))
    if optimize:
        assert mock_download_model_artifact.call_count == 2
        mock_download_model_artifact.assert_has_calls(
            [
                call(
                    src_path=Path("inputs/openvino.bin"),
                    dst_dir_path=Path("work_dir"),
                    use_presigned_url=False,
                ),
                call(
                    src_path=Path("inputs/openvino.xml"),
                    dst_dir_path=Path("work_dir"),
                    use_presigned_url=False,
                ),
            ]
        )
    else:
        mock_download_model_artifact.assert_called_once_with(
            src_path=Path("inputs/model.pth"), dst_dir_path=Path("work_dir"), use_presigned_url=False
        )
