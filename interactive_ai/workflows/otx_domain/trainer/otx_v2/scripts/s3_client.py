# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
from __future__ import annotations

import logging
import os
import random
import time
from datetime import timedelta
from functools import wraps
from io import BytesIO
from pathlib import Path
from typing import TYPE_CHECKING

from minio import Minio
from minio.credentials import IamAwsProvider
from minio.datatypes import Object
from minio.error import InvalidResponseError, S3Error
from pyarrow.fs import S3FileSystem

if TYPE_CHECKING:
    from collections.abc import Callable, Iterable, Sequence

S3_ADDRESS = "s3.amazonaws.com"

logger = logging.getLogger(__name__)


def retry_on_rate_limit(initial_delay: float = 1.0, max_retries: int = 5, max_backoff: float = 20.0) -> Callable:
    """
    Decorator to automatically retry a method using exponential back-off strategy.
    If the decorated method raises an InvalidResponseError with error code 429 or 503, it will be retried up to 5 times.
    The delay between requests increases exponentially with jitter, similar to AWS SDK implementation:
    https://docs.aws.amazon.com/sdkref/latest/guide/feature-retry-behavior.html
    This is useful to avoid breaking the current operation when the rate limit is hit. When the called method fails due
    to a 429 or 503 error, it is tried again after a short time.

    :param initial_delay: Initial delay in seconds before retrying after a 429 or 503 error
    :param max_retries: Maximum number of retries
    :param max_backoff: Maximum backoff time in seconds
    """

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            delay = initial_delay
            retries = 0
            while retries < max_retries:
                try:
                    return func(*args, **kwargs)
                except InvalidResponseError as e:
                    if e._code not in (429, 503):
                        raise

                    # ruff: noqa: S311
                    jitter = random.uniform(0, 1)  # nosec
                    backoff_time = min(jitter * (2**retries) * delay, max_backoff)
                    time.sleep(backoff_time)
                    retries += 1

            raise RuntimeError(
                f"Max retries reached for function {func.__name__} after receiving 429 or 503 response "
                f"{retries} times in a row."
            )

        return wrapper

    return decorator


class S3Client:
    def __init__(self):
        self.client: Minio
        self.presigned_urls_client: Minio
        self.s3fs: S3FileSystem
        s3_credentials_provider = os.environ.get("S3_CREDENTIALS_PROVIDER")
        if s3_credentials_provider == "local":
            self.client, self.presigned_urls_client, self.s3fs = self.__authenticate_on_prem_client()
        elif s3_credentials_provider == "aws":
            self.client, self.presigned_urls_client, self.s3fs = self.__authenticate_saas_client()
        else:
            raise ValueError(
                "Environment variable S3_CREDENTIALS_PROVIDER should be set to either 'local' or 'aws' for S3 to work."
            )

    @staticmethod
    def __validate_environment_variables(required_variables: Sequence[str]) -> None:
        """
        Check if environment variables required for S3 are set.

        :param required_variables: A sequence of strings containing the names of the environment variables required.
        :raises ValueError: If one or more environment variables are missing.
        """
        missing_env_variables = set(required_variables) - set(os.environ)
        if missing_env_variables:
            missing_variables_str = ", ".join(missing_env_variables)
            raise ValueError(
                f"Environment variable(s) {missing_variables_str} were not set, but they are required for S3 to work."
            )

    @staticmethod
    def __authenticate_on_prem_client() -> tuple[Minio, Minio, S3FileSystem]:
        """
        Authenticate a Minio client for on-premises deployment using the credentials specified in the environment
        variables.

        :return: Tuple containing a minio client using standard secret/access key and the presigned url secret/access
        key.
        """
        S3Client.__validate_environment_variables(
            required_variables=[
                "S3_ACCESS_KEY",
                "S3_SECRET_KEY",
                "S3_PRESIGNED_URL_ACCESS_KEY",
                "S3_PRESIGNED_URL_SECRET_KEY",
            ]
        )
        host_name = os.environ.get("S3_HOST", "impt-seaweed-fs:8333")
        presigned_urls_client = Minio(
            endpoint=host_name,
            secure=False,
            access_key=os.environ.get("S3_PRESIGNED_URL_ACCESS_KEY", ""),
            secret_key=os.environ.get("S3_PRESIGNED_URL_SECRET_KEY", ""),
        )
        client = Minio(
            endpoint=host_name,
            secure=False,
            access_key=os.environ.get("S3_ACCESS_KEY", ""),
            secret_key=os.environ.get("S3_SECRET_KEY", ""),
        )
        s3fs = S3FileSystem(
            access_key=os.environ.get("S3_ACCESS_KEY", ""),
            secret_key=os.environ.get("S3_SECRET_KEY", ""),
            scheme="http",
            endpoint_override=host_name,
        )
        return client, presigned_urls_client, s3fs

    @staticmethod
    def __authenticate_saas_client() -> tuple[Minio, Minio, S3FileSystem]:
        """
        Authenticate a Minio client for SaaS deployment using a web identity token.
        1. Validate the required environment variables
        2. Generate the credentials by authenticating to IAM, this automatically uses the defined environment variables
        3. Initialize Minio client using these credentials.
        In SaaS, there is no distinction between normal and presigned URL credentials
        """
        S3Client.__validate_environment_variables(
            required_variables=[
                "AWS_ROLE_ARN",
                "AWS_REGION",
                "AWS_WEB_IDENTITY_TOKEN_FILE",
            ]
        )

        provider = IamAwsProvider()
        client = Minio(
            endpoint=S3_ADDRESS,
            region=os.environ.get("AWS_REGION"),
            credentials=provider,
            secure=True,
        )

        credentials = provider.retrieve()
        s3fs = S3FileSystem(
            access_key=credentials.access_key,
            secret_key=credentials.secret_key,
            session_token=credentials.session_token,
            region=os.environ.get("AWS_REGION"),
            scheme="https",
        )

        return client, client, s3fs

    @retry_on_rate_limit()
    def check_file_exists(self, bucket_name: str, object_name: Path) -> bool:
        try:
            self.client.stat_object(bucket_name=bucket_name, object_name=str(object_name))
        except S3Error as e:
            logger.debug(e)
            return False
        else:
            return True

    @retry_on_rate_limit()
    def upload_file_from_local_disk(
        self, bucket_name: str, relative_path: Path, local_file_path: Path, overwrite: bool = False
    ) -> None:
        if not overwrite and self.check_file_exists(bucket_name=bucket_name, object_name=relative_path):
            raise FileExistsError(f"Cannot save file, because a file already exists at {relative_path}.")

        self.client.fput_object(
            bucket_name=bucket_name,
            object_name=str(relative_path),
            file_path=local_file_path,
        )

    @retry_on_rate_limit()
    def upload_file_from_bytes(
        self, bucket_name: str, relative_path: Path, input_bytes: bytes, overwrite: bool = False
    ) -> None:
        if not overwrite and self.check_file_exists(bucket_name=bucket_name, object_name=relative_path):
            raise FileExistsError(f"Cannot save file, because a file already exists at {relative_path}.")

        self.client.put_object(
            bucket_name=bucket_name,
            object_name=str(relative_path),
            data=BytesIO(input_bytes),
            length=len(input_bytes),
        )

    @retry_on_rate_limit()
    def download_file(self, bucket_name: str, relative_path: Path, file_path: Path) -> None:
        logger.info(f"Downloading {relative_path} to {file_path}")
        self.client.fget_object(bucket_name=bucket_name, object_name=str(relative_path), file_path=file_path)

    @retry_on_rate_limit()
    def list_files(self, bucket_name: str, relative_path: Path, recursive: bool = False) -> Iterable[Object]:
        results = list(
            self.client.list_objects(bucket_name=bucket_name, prefix=str(relative_path), recursive=recursive)
        )

        if len(results) == 1:
            obj = next(iter(results))
            if obj.is_dir:
                # NOTE: The following logic is to extract depth-1 children
                # For example, if prefix has this tree file structure,
                # ├── configurations
                # ├── exportable_codes
                # ├── logs
                # │   ├── error.json
                # │   └── otx-full.log
                # └── models
                # The return list will be [prefix/configurations, prefix/exportable_codes, prefix/logs, prefix/models]
                objects = self.client.list_objects(bucket_name=bucket_name, prefix=str(relative_path), recursive=True)
                rel_paths = {Path(obj.object_name).relative_to(Path(relative_path)): obj for obj in objects}

                children_files = {rel_path: obj for rel_path, obj in rel_paths.items() if len(rel_path.parents) == 1}
                children_dirs = {
                    dir_name: Object(obj.bucket_name, object_name=str(Path(relative_path) / dir_name) + "/")
                    for rel_path, obj in rel_paths.items()
                    if len(rel_path.parents) > 1 and (dir_name := list(reversed(rel_path.parents))[1])
                }
                children = {**children_files, **children_dirs}
                return children.values()

            # NOTE: If the query path is for a file, it should return a empty list.
            return []

        return results

    @retry_on_rate_limit()
    def get_presigned_url(self, bucket_name: str, relative_path: Path) -> str:
        return self.presigned_urls_client.presigned_get_object(
            bucket_name=bucket_name,
            object_name=str(relative_path),
            expires=timedelta(minutes=15),
        )


class S3ClientSingleton:
    _instance: S3Client | None = None

    @classmethod
    def instance(cls, renew: bool = False) -> S3Client:
        if not renew and cls._instance:
            return cls._instance

        try:
            cls._instance = S3Client()
        except Exception:
            logger.exception("Failed to initialize S3 client")
            raise
        return cls._instance
