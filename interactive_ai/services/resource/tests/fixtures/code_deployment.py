# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
import pytest

from entities.deployment import ModelIdentifier


@pytest.fixture
def fxt_model_identifiers(
    fxt_optimized_model_1_with_exportable_code,
    fxt_optimized_model_2_with_exportable_code,
):
    yield [
        ModelIdentifier(
            model_id=fxt_optimized_model_1_with_exportable_code.id_,
            model_storage_id=fxt_optimized_model_1_with_exportable_code.model_storage.id_,
        ),
        ModelIdentifier(
            model_id=fxt_optimized_model_2_with_exportable_code.id_,
            model_storage_id=fxt_optimized_model_2_with_exportable_code.model_storage.id_,
        ),
    ]
