# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
import logging
import os

from platform_utils.errors import PathCreationError
from texts.validators import PathValidatorsTexts

logger = logging.getLogger(__name__)


def create_data_folder(path: str) -> None:
    """
    This function creates a directory with the specified path and sets its permissions to 750.
    Raises PathCreationError if the directory already exists or if there are permission issues.
    """
    try:
        os.makedirs(path, mode=0o750)
    except FileExistsError:
        logger.error("Directory already exists: %s", path)
        raise PathCreationError(PathValidatorsTexts.path_already_exists.format(path=path))
    except PermissionError:
        logger.error("Permission denied for path: %s", path)
        raise PathCreationError(PathValidatorsTexts.path_permission_error.format(path=path))
