# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

from platform_utils.scale_helm_chart_resources import (
    find_nested_resources,
    k8s_cpu_to_millicpus,
    k8s_memory_to_mibibytes,
    scale_cpu_resource,
    scale_memory_resource,
)


def test_k8s_cpu_to_millicpus():
    assert k8s_cpu_to_millicpus("8") == 8000
    assert k8s_cpu_to_millicpus("1234m") == 1234
    assert k8s_cpu_to_millicpus("0.5") == 500


def test_k8s_memory_to_mibibytes():
    assert k8s_memory_to_mibibytes("2Gi") == 2048
    assert k8s_memory_to_mibibytes("200Mi") == 200
    assert k8s_memory_to_mibibytes("0.5Gi") == 512
    assert k8s_memory_to_mibibytes("1Gi") == 1024


def test_scale_cpu_resource():
    assert scale_cpu_resource(cpu_resource="3", resource_multiplier=2.0) == "6000m"
    assert scale_cpu_resource(cpu_resource="3", resource_multiplier=1.0) == "3000m"
    assert scale_cpu_resource(cpu_resource="3", resource_multiplier=0.5) == "1500m"
    assert scale_cpu_resource(cpu_resource="50m", resource_multiplier=0.5, minimal_millicpus=50) == "50m"


def test_scale_memory_resource():
    assert scale_memory_resource(memory_resource="2Gi", resource_multiplier=2.0) == "4096Mi"
    assert scale_memory_resource(memory_resource="2Gi", resource_multiplier=1.0) == "2048Mi"
    assert scale_memory_resource(memory_resource="2Gi", resource_multiplier=0.5) == "1024Mi"
    assert scale_memory_resource(memory_resource="50Mi", resource_multiplier=0.5, minimal_mibibytes=50) == "50Mi"


def test_find_nested_resources():
    test_dict = {
        "chart1": {
            "subchart1": {"resources": {"requests": {"cpu": 1, "memory": "2Gi"}}},
            "subchart2": {"resources": {}},
        },
        "chart2": {"resources": {}},
    }

    found_resources = list(find_nested_resources(test_dict))
    assert ("chart1.subchart1.resources", {"requests": {"cpu": 1, "memory": "2Gi"}}) in found_resources
    assert ("chart1.subchart2.resources", {}) in found_resources
    assert ("chart2.resources", {}) in found_resources
