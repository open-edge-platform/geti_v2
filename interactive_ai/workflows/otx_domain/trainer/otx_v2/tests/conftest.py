# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE


import os
from pathlib import Path

import pytest


@pytest.fixture
def fxt_dir_assets() -> Path:
    return Path(__file__).parent / "assets"


@pytest.fixture(autouse=True)
def fxt_model_templates_dir(tmpdir):
    os.environ["MODEL_TEMPLATES_DIR"] = str(tmpdir)
    yield
    os.environ.pop("MODEL_TEMPLATES_DIR")


@pytest.fixture(autouse=True)
def fxt_shard_files_dir(tmpdir):
    os.environ["SHARD_FILES_DIR"] = str(tmpdir)
    yield
    os.environ.pop("SHARD_FILES_DIR")


@pytest.fixture(scope="session", autouse=True)
def ensure_torch_hub_checkpoints():
    checkpoints_dir = Path.home() / ".cache" / "torch" / "hub" / "checkpoints"
    checkpoints_dir.mkdir(parents=True, exist_ok=True)
