# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

"""Utilities for mocking Kubernetes abstraction models."""

from collections.abc import Mapping
from unittest.mock import Mock

from kubernetes.client.models.v1_object_meta import V1ObjectMeta
from kubernetes.client.models.v1_pod import V1Pod


def v1_pod_from_map(doc: Mapping) -> V1Pod:
    """Parses V1Pod dict manifest."""
    pod = Mock(V1Pod)
    doc_tmp = dict(doc)

    pod.metadata = v1_object_meta_from_map(doc_tmp.pop("metadata"))

    for key, val in doc_tmp.items():
        setattr(pod, key, val)

    return pod


def v1_object_meta_from_map(doc: Mapping) -> V1ObjectMeta:
    """Parses V1ObjectMeta dict manifest."""
    meta = Mock(V1ObjectMeta)

    for key, val in doc.items():
        setattr(meta, key, val)

    return meta
