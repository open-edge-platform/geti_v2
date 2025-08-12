# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

from platform_utils.calculate_resource_multiplier import (
    calculate_resource_multiplier,
    k8s_cpu_to_millicpus,
    k8s_memory_to_kibibytes,
)


def test_k8s_cpu_to_millicpus():
    assert k8s_cpu_to_millicpus("8") == 8000
    assert k8s_cpu_to_millicpus("1234m") == 1234
    assert k8s_cpu_to_millicpus("0.5") == 500


def test_k8s_memory_to_kibibytes():
    assert k8s_memory_to_kibibytes("2Gi") == 2097152
    assert k8s_memory_to_kibibytes("200Mi") == 204800
    assert k8s_memory_to_kibibytes("0.5Gi") == 524288
    assert k8s_memory_to_kibibytes("1Gi") == 1048576


def test_calculate_resource_multiplier():
    high_resources = {
        "cpu": "95800m",
        "ephemeral-storage": "332950519667",
        "hugepages-1Gi": "0",
        "hugepages-2Mi": "0",
        "memory": "263165140Ki",
        "pods": "110",
    }
    low_resources = {
        "cpu": "6",
        "ephemeral-storage": "332950519667",
        "hugepages-1Gi": "0",
        "hugepages-2Mi": "0",
        "memory": "12Gi",
        "pods": "110",
    }
    assert calculate_resource_multiplier(high_resources) == 1.0
    assert calculate_resource_multiplier(low_resources) == 0.7
