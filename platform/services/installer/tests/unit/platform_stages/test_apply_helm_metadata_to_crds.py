# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

from unittest.mock import patch

import pytest
from kubernetes.client import (
    V1CustomResourceDefinition,
    V1CustomResourceDefinitionList,
    V1CustomResourceDefinitionNames,
    V1CustomResourceDefinitionSpec,
    V1ObjectMeta,
)

from platform_stages.steps.apply_minor_version_changes.apply_helm_metadata_to_crds import (
    CRDS_GROUP_NAMES,
    K3S_KUBECONFIG_PATH,
    ApiException,
    CRDPatchingError,
    _get_crd_by_group_names,
    _get_release_name,
    _update_crds_with_helm_metadata,
    apply_helm_metadata_to_crds,
)

EXPECTED_CRDS = {
    "cert-manager": "cert-manager-crds",
    "flyte": "flyte-crds",
    "modelmesh-serving": "modelmesh-serving-crds",
    "istio": "istio-crds",
}


def create_crd(
    name: str,
    group: str,
    plural: str,
    singular: str,
    kind: str,
    short_names: list[str],
    scope: str = "Namespaced",
    versions=[],
):
    crd_names = V1CustomResourceDefinitionNames(plural=plural, singular=singular, kind=kind, short_names=short_names)
    crd_spec = V1CustomResourceDefinitionSpec(group=group, names=crd_names, scope=scope, versions=versions)
    crd_metadata = V1ObjectMeta(name=name, namespace="impt")
    return V1CustomResourceDefinition(spec=crd_spec, metadata=crd_metadata)


@pytest.fixture
def unrelated_crd_list():
    crd1 = create_crd(
        name="example", group="example.com", plural="examples", singular="example", kind="Example", short_names=["ex"]
    )
    crd2 = create_crd(
        name="example", group="another.com", plural="another", singular="another", kind="Another", short_names=["an"]
    )
    return V1CustomResourceDefinitionList(items=[crd1, crd2])


@pytest.fixture
def target_crd_list():
    crd1 = create_crd(
        name="virtualservices.networking.istio.io",
        group="networking.istio.io",
        plural="virtualservices",
        singular="virtualservice",
        kind="VirtualService",
        short_names=["vs"],
    )
    crd2 = create_crd(
        name="certificaterequests.cert-manager.io",
        group=CRDS_GROUP_NAMES[0],
        plural="certificaterequests",
        singular="certificaterequest",
        kind="CertificateRequest",
        short_names=["cr", "crs"],
    )
    crd3 = create_crd(
        name="inferenceservices.serving.kserve.io",
        group=CRDS_GROUP_NAMES[2],
        plural="inferenceservices",
        singular="inferenceservice",
        kind="InferenceService",
        short_names=["isvc"],
    )

    return V1CustomResourceDefinitionList(items=[crd1, crd2, crd3])


@pytest.fixture
def all_crd_list(unrelated_crd_list, target_crd_list):
    combined_items = unrelated_crd_list.items + target_crd_list.items
    return V1CustomResourceDefinitionList(items=combined_items)


@pytest.fixture
def mock_kubernetes_config_handler(mocker):
    yield mocker.patch(
        "platform_stages.steps.apply_minor_version_changes.apply_helm_metadata_to_crds.KubernetesConfigHandler"
    )


@pytest.fixture
def mock_api_client(mocker):
    yield mocker.patch("platform_stages.steps.apply_minor_version_changes.apply_helm_metadata_to_crds.client.ApiClient")


@pytest.fixture
def mock_api_extensions_v1(mocker):
    yield mocker.patch(
        "platform_stages.steps.apply_minor_version_changes.apply_helm_metadata_to_crds.client.ApiextensionsV1Api"
    )


def test_apply_helm_metadata_to_crds_success() -> None:
    """
    This test covers the positive scenario for 'apply_helm_metadata_to_crds'.
    """

    kube_config = "/fake/kube/config"
    with (
        patch(
            "platform_stages.steps.apply_minor_version_changes.apply_helm_metadata_to_crds._get_crd_by_group_names"
        ) as mock_get_crd_by_group_names,
        patch(
            "platform_stages.steps.apply_minor_version_changes.apply_helm_metadata_to_crds._update_crds_with_helm_metadata"
        ) as mock_update_crds_with_helm_metadata,
    ):
        apply_helm_metadata_to_crds(kube_config=kube_config)

        assert mock_get_crd_by_group_names.call_count == 1
        assert mock_update_crds_with_helm_metadata.call_count == 1


def test_apply_helm_metadata_to_get_crd_by_group_names_fails() -> None:
    """
    Test scenario where `_get_crd_by_group_names` raises an ApiException.
    """
    kube_config = "/fake/kube/config"
    with (
        patch(
            "platform_stages.steps.apply_minor_version_changes.apply_helm_metadata_to_crds._get_crd_by_group_names"
        ) as mock_get_crd_by_group_names,
        patch(
            "platform_stages.steps.apply_minor_version_changes.apply_helm_metadata_to_crds._update_crds_with_helm_metadata"
        ) as mock_update_crds_with_helm_metadata,
    ):
        mock_get_crd_by_group_names.side_effect = ApiException

        with pytest.raises(CRDPatchingError):
            apply_helm_metadata_to_crds(kube_config=kube_config)

        assert mock_get_crd_by_group_names.call_count == 1
        assert mock_update_crds_with_helm_metadata.call_count == 0


@pytest.mark.parametrize("exception_type", [ApiException, ValueError])
def test_apply_helm_metadata_to_update_crds_with_helm_metadata_fails(exception_type) -> None:
    """
    Test scenario where `_update_crds_with_helm_metadata` raises ApiException and ValueError.
    """
    kube_config = "/fake/kube/config"
    with (
        patch(
            "platform_stages.steps.apply_minor_version_changes.apply_helm_metadata_to_crds._get_crd_by_group_names"
        ) as mock_get_crd_by_group_names,
        patch(
            "platform_stages.steps.apply_minor_version_changes.apply_helm_metadata_to_crds"
            "._update_crds_with_helm_metadata"
        ) as mock_update_crds_with_helm_metadata,
    ):
        mock_update_crds_with_helm_metadata.side_effect = exception_type

        with pytest.raises(CRDPatchingError):
            apply_helm_metadata_to_crds(kube_config=kube_config)

        assert mock_get_crd_by_group_names.call_count == 1
        assert mock_update_crds_with_helm_metadata.call_count == 1


@pytest.mark.parametrize(
    "group_names, expected_results",
    [
        ([CRDS_GROUP_NAMES[0], CRDS_GROUP_NAMES[1]], [EXPECTED_CRDS["cert-manager"], EXPECTED_CRDS["flyte"]]),
        (
            [CRDS_GROUP_NAMES[0], CRDS_GROUP_NAMES[2]],
            [EXPECTED_CRDS["cert-manager"], EXPECTED_CRDS["modelmesh-serving"]],
        ),
        ([CRDS_GROUP_NAMES[1]], [EXPECTED_CRDS["flyte"]]),
        (
            [CRDS_GROUP_NAMES[0], CRDS_GROUP_NAMES[1], CRDS_GROUP_NAMES[2], CRDS_GROUP_NAMES[3]],
            [
                EXPECTED_CRDS["cert-manager"],
                EXPECTED_CRDS["flyte"],
                EXPECTED_CRDS["modelmesh-serving"],
                EXPECTED_CRDS["istio"],
            ],
        ),
    ],
)
def test_get_release_name_success(group_names, expected_results):
    """
    This test covers the positive scenario for '_get_release_name'.
    """
    actual_result = [_get_release_name(group=group_name) for group_name in group_names]

    assert actual_result == expected_results


@pytest.mark.parametrize("group_name", ["some-not-existing-group", "cert-manager", "kserve.io"])
def test_get_release_name_fails(group_name):
    """
    Test scenario where `_update_crds_with_helm_metadata` raises ValueError.
    """

    with pytest.raises(ValueError):
        _get_release_name(group=group_name)


@pytest.mark.parametrize(
    "group_names",
    (
        ("example.com",),
        ("example.com", "another.com"),
        ("example.com", CRDS_GROUP_NAMES[2]),  # now serving modelmesh, prev-ly istio
        (CRDS_GROUP_NAMES[2], "example.com", CRDS_GROUP_NAMES[3]),  # was istio, example, modelmesh
    ),
)
def test_get_crd_by_group_names(
    mock_kubernetes_config_handler, mock_api_client, mock_api_extensions_v1, all_crd_list, group_names
):
    """
    This test covers the positive scenario for '_get_crd_by_group_names', where result is not an empty list.
    """
    mock_kubernetes_config_handler.return_value = None
    mock_api_client.return_value.__enter__.return_value = mock_api_client
    mock_api_client.return_value.__exit__.return_value = None

    mock_api_extensions_v1.return_value.list_custom_resource_definition.return_value = all_crd_list

    result = _get_crd_by_group_names(group_names, kube_config="path/to/kubeconfig")

    assert len(result) == len(group_names), (
        f"The result must contain the same number of elements as the provided group names."
        f" Expected {len(group_names)}, but got {len(result)}."
    )
    mock_kubernetes_config_handler.assert_called_once_with(kube_config="path/to/kubeconfig")
    mock_api_extensions_v1.return_value.list_custom_resource_definition.assert_called_once()


def test_get_crd_by_group_names_no_result(
    mock_kubernetes_config_handler, mock_api_client, mock_api_extensions_v1, all_crd_list
):
    """
    This test covers the positive scenario for '_get_crd_by_group_names', where result is an empty list.
    """
    mock_kubernetes_config_handler.return_value = None
    mock_api_client.return_value.__enter__.return_value = mock_api_client
    mock_api_client.return_value.__exit__.return_value = None

    group_names = ("not-existing-crd-group",)
    mock_api_extensions_v1.return_value.list_custom_resource_definition.return_value = all_crd_list

    result = _get_crd_by_group_names(group_names, kube_config="path/to/kubeconfig")

    assert not result, f"The result must be an empty list. Expected [], but got {result}"
    mock_kubernetes_config_handler.assert_called_once_with(kube_config="path/to/kubeconfig")
    mock_api_extensions_v1.return_value.list_custom_resource_definition.assert_called_once()


def test_get_crd_by_group_names_fails(mock_kubernetes_config_handler, mock_api_client, mock_api_extensions_v1):
    """
    Test scenario where `_get_crd_by_group_names` raises an ApiException.
    """
    mock_kubernetes_config_handler.return_value = None
    mock_api_client.return_value.__enter__.return_value = mock_api_client
    mock_api_client.return_value.__exit__.return_value = None

    mock_api_extensions_v1.return_value.list_custom_resource_definition.side_effect = ApiException

    group_names = ("does-not-matter",)
    with pytest.raises(ApiException):
        _get_crd_by_group_names(group_names=group_names)

    mock_kubernetes_config_handler.assert_called_once_with(kube_config=K3S_KUBECONFIG_PATH)
    mock_api_extensions_v1.return_value.list_custom_resource_definition.assert_called_once()


def test_update_crds_with_helm_metadata(
    mock_kubernetes_config_handler, mock_api_client, mock_api_extensions_v1, target_crd_list
):
    """
    This test covers the positive scenario for '_update_crds_with_helm_metadata'.
    """
    mock_kubernetes_config_handler.return_value = None
    mock_api_client.return_value.__enter__.return_value = mock_api_client
    mock_api_client.return_value.__exit__.return_value = None

    mock_api_extensions_v1.return_value.patch_custom_resource_definition.return_value = None
    filtered_crds = list(target_crd_list.items)

    _update_crds_with_helm_metadata(crds=filtered_crds)

    mock_kubernetes_config_handler.assert_called_once_with(kube_config=K3S_KUBECONFIG_PATH)
    assert mock_api_extensions_v1.return_value.patch_custom_resource_definition.call_count == len(filtered_crds)


def test_update_crds_with_helm_metadata_wrong_release_name(
    mock_kubernetes_config_handler, mock_api_client, mock_api_extensions_v1, unrelated_crd_list
):
    """
    Test scenario where `_update_crds_with_helm_metadata` raises a ValueError.

    This exception occurs when the group of a passed CRD does not appear in the list of expected group names.
    """
    mock_kubernetes_config_handler.return_value = None
    mock_api_client.return_value.__enter__.return_value = mock_api_client
    mock_api_client.return_value.__exit__.return_value = None

    mock_api_extensions_v1.return_value.patch_custom_resource_definition.return_value = None

    filtered_crds = list(unrelated_crd_list.items)

    with pytest.raises(ValueError):
        _update_crds_with_helm_metadata(crds=filtered_crds)

    mock_kubernetes_config_handler.assert_called_once_with(kube_config=K3S_KUBECONFIG_PATH)
    assert mock_api_extensions_v1.return_value.patch_custom_resource_definition.call_count == 0


def test_update_crds_with_helm_metadata_failing_patch_crd(
    mock_kubernetes_config_handler, mock_api_client, mock_api_extensions_v1, target_crd_list
):
    """
    Test scenario where `_update_crds_with_helm_metadata` raises an ApiException.
    """
    mock_kubernetes_config_handler.return_value = None
    mock_api_client.return_value.__enter__.return_value = mock_api_client
    mock_api_client.return_value.__exit__.return_value = None

    mock_api_extensions_v1.return_value.patch_custom_resource_definition.side_effect = ApiException

    filtered_crds = list(target_crd_list.items)

    with pytest.raises(ApiException):
        _update_crds_with_helm_metadata(crds=filtered_crds)

    mock_kubernetes_config_handler.assert_called_once_with(kube_config=K3S_KUBECONFIG_PATH)
    assert mock_api_extensions_v1.return_value.patch_custom_resource_definition.call_count == 1
