# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import base64
import subprocess
from unittest.mock import MagicMock, Mock, mock_open, patch

import pytest
from click.testing import CliRunner
from kubernetes.client import (
    V1ClusterRole,
    V1ClusterRoleBinding,
    V1ClusterRoleBindingList,
    V1ClusterRoleList,
    V1CustomResourceDefinition,
    V1CustomResourceDefinitionList,
    V1Namespace,
    V1PersistentVolume,
    V1PersistentVolumeClaim,
    V1Secret,
    V1SecretList,
    V1StorageClass,
)
from kubernetes.client.exceptions import ApiException

from checks.errors import CumulativeCheckError
from commands.upgrade import (
    _get_credentials,
    _get_data_folder,
    _get_newest_helm_release_secret,
    _get_tls_certificates,
    cleanup_kafka_pv,
    cleanup_kubelet_csr_approver,
    cleanup_main_ns,
    cleanup_platform,
    delete_namespaces,
    gather_data_for_migration,
    prepare_secrets,
    relabel_pv,
    upgrade,
)
from configuration_models.upgrade_config import UpgradeConfig
from constants.platform import (
    DEFAULT_NAMESPACE,
    GETI_LABEL_KEY,
    GETI_LABEL_VALUE,
    KUBELET_CSR_APPROVER_NAME,
    NAMESPACE_CHART,
    PV_CHART,
    TOOLS_CHART,
)
from platform_utils.errors import (
    CredentialsError,
    HelmReleaseError,
    KafkaPVRemovalError,
    NamespaceCleanUpError,
    PVInfoError,
    ResourceDeletionError,
    ResourcePatchError,
    SecretsPreparationError,
    TLSCertificateEmptyError,
    TLSCertificateInfoError,
)


@pytest.fixture
def core_api_mock(mocker):
    mocker.patch("commands.upgrade.KubernetesConfigHandler")
    mocker.patch("commands.upgrade.kube_client.ApiClient", return_value=MagicMock())
    core_api_mock = mocker.patch("commands.upgrade.kube_client.CoreV1Api").return_value
    return core_api_mock


@pytest.fixture
def app_api_mock(mocker):
    mocker.patch("commands.upgrade.KubernetesConfigHandler")
    mocker.patch("commands.upgrade.kube_client.ApiClient", return_value=MagicMock())
    apps_api_mock = mocker.patch("commands.upgrade.kube_client.AppsV1Api").return_value
    return apps_api_mock


@pytest.fixture
def rbac_api_mock(mocker):
    mocker.patch("commands.upgrade.KubernetesConfigHandler")
    mocker.patch("commands.upgrade.kube_client.ApiClient", return_value=MagicMock())
    rbac_api_mock = mocker.patch("commands.upgrade.kube_client.RbacAuthorizationV1Api").return_value
    return rbac_api_mock


@pytest.fixture
def storage_api_mock(mocker):
    mocker.patch("commands.upgrade.KubernetesConfigHandler")
    mocker.patch("commands.upgrade.kube_client.ApiClient", return_value=MagicMock())
    storage_api_mock = mocker.patch("commands.upgrade.kube_client.StorageV1Api").return_value
    return storage_api_mock


@pytest.fixture
def admission_reg_api_mock(mocker):
    mocker.patch("commands.upgrade.KubernetesConfigHandler")
    mocker.patch("commands.upgrade.kube_client.ApiClient", return_value=MagicMock())
    admission_reg_api_mock = mocker.patch("commands.upgrade.kube_client.AdmissionregistrationV1Api").return_value
    return admission_reg_api_mock


@pytest.fixture
def extension_api_mock(mocker):
    mocker.patch("commands.upgrade.KubernetesConfigHandler")
    mocker.patch("commands.upgrade.kube_client.ApiClient", return_value=MagicMock())
    extension_api_mock = mocker.patch("commands.upgrade.kube_client.ApiextensionsV1Api").return_value
    return extension_api_mock


def test_run_initial_checks_ok(mocker):
    run_initial_checks_mock: Mock = mocker.patch("commands.upgrade.run_initial_checks")
    runner = CliRunner()
    runner.invoke(upgrade)

    run_initial_checks_mock.assert_called_once()


def test_run_initial_checks_ko(mocker):
    run_initial_checks_mock: Mock = mocker.patch(
        "commands.upgrade.run_initial_checks", side_effect=CumulativeCheckError
    )
    runner = CliRunner()
    result = runner.invoke(upgrade)

    assert result.exception
    run_initial_checks_mock.assert_called_once()


def test_get_data_folder_ok(core_api_mock):
    # Mock the Kubernetes API response
    mock_pv = Mock(V1PersistentVolume)
    mock_pv.spec.host_path.path = "/data/storage"
    core_api_mock.read_persistent_volume.return_value = mock_pv

    # Call the function
    result = _get_data_folder()

    # Assert the result
    assert result == "/data/storage"
    core_api_mock.read_persistent_volume.assert_called_once_with(name="data-storage-volume")


def test_get_data_folder_ko(core_api_mock):
    # Mock the Kubernetes API response
    core_api_mock.read_persistent_volume.side_effect = ApiException("API error")

    # Call the function
    with pytest.raises(PVInfoError):
        _get_data_folder()


def test_get_tls_certificates_cert_manager(core_api_mock):
    # Mock the Kubernetes API response
    mock_custom_tls = Mock(V1Secret)
    mock_custom_tls.metadata.annotations = {"cert-manager.io/issuer-group": "mock"}
    core_api_mock.read_namespaced_secret.return_value = mock_custom_tls

    # Call the function
    result = _get_tls_certificates()

    # Assert the result
    assert result is None


def test_get_tls_certificates_custom(core_api_mock):
    # Mock the Kubernetes API response
    mock_custom_tls = MagicMock(V1Secret)
    mock_custom_tls.data = {
        "tls.crt": base64.b64encode(b"dummy crt"),
        "tls.key": base64.b64encode(b"dummy tls"),
    }
    core_api_mock.read_namespaced_secret.return_value = mock_custom_tls

    # Call the function
    cert, key = _get_tls_certificates()

    # Assert the result
    assert cert == "dummy crt"
    assert key == "dummy tls"


def test_get_tls_certificates_custom_ko(core_api_mock):
    # Mock the Kubernetes API response
    mock_custom_tls = MagicMock(V1Secret)
    mock_custom_tls.data = {}
    core_api_mock.read_namespaced_secret.return_value = mock_custom_tls

    # Call the function
    with pytest.raises(TLSCertificateEmptyError):
        _get_tls_certificates()


def test_get_tls_certificates_ko(core_api_mock):
    # Mock the Kubernetes API response
    core_api_mock.read_namespaced_secret.side_effect = ApiException("API error")

    # Call the function
    with pytest.raises(TLSCertificateInfoError):
        _get_tls_certificates()


def test_get_newest_helm_release_secret_ok(core_api_mock):
    # Mock the Kubernetes API response
    mock_control_plane_secret_1 = Mock(V1Secret)
    mock_control_plane_secret_1.metadata.name = "sh.helm.release.v1.control-plane.v1"
    mock_control_plane_secret_2 = Mock(V1Secret)
    mock_control_plane_secret_2.metadata.name = "sh.helm.release.v1.control-plane.v2"
    mock_dummy_secret = Mock(V1Secret)
    mock_dummy_secret.metadata.name = "dummy"
    mock_secrets = MagicMock(V1SecretList)
    mock_secrets.items = [mock_control_plane_secret_1, mock_control_plane_secret_2, mock_dummy_secret]
    core_api_mock.list_namespaced_secret.return_value = mock_secrets

    # Call the function
    latest_secret: V1Secret = _get_newest_helm_release_secret(namespace="dummy")

    # Assert the result
    latest_secret.metadata.name = mock_control_plane_secret_2.metadata.name


def test_get_newest_helm_release_secret_empty(core_api_mock):
    # Mock the Kubernetes API response
    mock_dummy_secret = Mock(V1Secret)
    mock_dummy_secret.metadata.name = "dummy"
    mock_secrets = MagicMock(V1SecretList)
    mock_secrets.items = [mock_dummy_secret]
    core_api_mock.list_namespaced_secret.return_value = mock_secrets
    # Call the function
    latest_secret: V1Secret = _get_newest_helm_release_secret(namespace="dummy")

    # Assert the result
    assert latest_secret is None


def test_get_newest_helm_release_secret_ko(core_api_mock):
    # Mock the Kubernetes API response
    core_api_mock.list_namespaced_secret.side_effect = ApiException("API error")

    # Call the function
    with pytest.raises(HelmReleaseError):
        _get_newest_helm_release_secret(namespace="dummy")


def test_get_credentials_ok(mocker, core_api_mock):
    # Mock the Kubernetes API response
    mock_latest_release = Mock(V1Secret)
    mock_latest_release.metadata.name = "latest"
    mock_latest_release.data = {
        "release": "H4sIAAAAAAAA/ytJLS4BAAx+f9gEAAAA"  # Base64 encoded gzip data
    }
    mocker.patch("commands.upgrade._get_newest_helm_release_secret", return_value=mock_latest_release)
    core_api_mock.read_namespaced_secret.return_value = mock_latest_release

    # Call the function
    with (
        patch("base64.b64decode", side_effect=[b"mock-decoded-once", b"mock-decoded-twice"]),
        patch(
            "gzip.decompress",
            return_value=b'{"config": {"global": {"initial_admin_user_login": "admin", "initial_admin_user_password": "password"}}}',
        ),
    ):
        result = _get_credentials()

    # Assert the result
    assert result == ("admin", "password")
    core_api_mock.read_namespaced_secret.assert_called_once_with(
        name=mock_latest_release.metadata.name, namespace="impt"
    )


def test_get_credentials_ko(mocker, core_api_mock):
    # Mock the Kubernetes API response
    mock_latest_release = Mock(V1Secret)
    mock_latest_release.metadata.name = "latest"
    mock_latest_release.data = {
        "release": "H4sIAAAAAAAA/ytJLS4BAAx+f9gEAAAA"  # Base64 encoded gzip data
    }
    mocker.patch("commands.upgrade._get_newest_helm_release_secret", return_value=mock_latest_release)
    core_api_mock.read_namespaced_secret.side_effect = ApiException("API error")

    # Call the function
    with pytest.raises(CredentialsError):
        _get_credentials()


def test_gather_data_for_migration_ok(mocker):
    # Mock functions
    mocker.patch("commands.upgrade._get_data_folder").return_value = "/dummy"
    mocker.patch("commands.upgrade._get_tls_certificates").return_value = ("cert", "key")
    mocker.patch("commands.upgrade._get_credentials").return_value = ("admin", "pass")
    mocker.patch("commands.upgrade.hash_ldap_password").return_value = "hashed"

    mock_config = UpgradeConfig()

    # Call the function
    gather_data_for_migration(config=mock_config)

    # Assert the result
    assert mock_config.data_folder.value == "/dummy"
    assert mock_config.tls_cert_content.value == "cert"
    assert mock_config.tls_key_content.value == "key"
    assert mock_config.username.value == "admin"
    assert mock_config.password.value == "pass"
    assert mock_config.password_sha.value == "hashed"


def test_prepare_secrets_ok(mocker, core_api_mock):
    # Mock the Kubernetes API response
    mock_secret = MagicMock(V1Secret)
    mock_secret.metadata.labels = None
    mock_secret.metadata.annotations = None
    core_api_mock.read_namespaced_secret.return_value = mock_secret

    mock_config = UpgradeConfig()
    mock_config.backup_location.value = "backup"

    # Call the function
    with patch("builtins.open", new_callable=mock_open):
        prepare_secrets(config=mock_config)

    # Assert the result
    assert core_api_mock.read_namespaced_secret.call_count == 5
    assert core_api_mock.patch_namespaced_secret.call_count == 5
    assert mock_secret.metadata.labels == {GETI_LABEL_KEY: GETI_LABEL_VALUE}
    assert mock_secret.metadata.annotations == {"meta.helm.sh/release-name": TOOLS_CHART}


def test_prepare_secrets_ko(core_api_mock):
    # Mock the Kubernetes API response
    core_api_mock.read_namespaced_secret.side_effect = ApiException("API error")

    mock_config = UpgradeConfig()

    # Call the function
    with pytest.raises(SecretsPreparationError):
        prepare_secrets(config=mock_config)


def test_delete_namespaces_ok(core_api_mock):
    # Call the function
    delete_namespaces()

    # Assert the result
    assert core_api_mock.delete_namespace.call_count == 5


def test_delete_namespaces_ko(core_api_mock):
    # Mock the Kubernetes API response
    core_api_mock.delete_namespace.side_effect = ApiException("API error")

    # Call the function
    with pytest.raises(NamespaceCleanUpError):
        delete_namespaces()


def test_delete_namespaces_already_deleted(core_api_mock):
    # Mock the Kubernetes API response
    core_api_mock.delete_namespace.side_effect = ApiException(status=404)

    # Call the function
    delete_namespaces()


def test_cleanup_main_ns_ok(mocker, core_api_mock):
    # Mock the Kubernetes API response
    mock_resource_deletion = mocker.patch("commands.upgrade._delete_resources")
    mock_ns = MagicMock(V1Namespace)
    mock_ns.metadata.labels = None
    mock_ns.metadata.annotations = None
    core_api_mock.read_namespace.return_value = mock_ns

    # Call the function
    cleanup_main_ns()

    # Assert the result
    assert mock_resource_deletion.call_count == 15
    assert core_api_mock.read_namespace.call_count == 1
    assert core_api_mock.patch_namespace.call_count == 1
    assert mock_ns.metadata.labels == {"app.kubernetes.io/managed-by": "Helm"}
    assert mock_ns.metadata.annotations == {
        "meta.helm.sh/release-name": NAMESPACE_CHART,
        "meta.helm.sh/release-namespace": DEFAULT_NAMESPACE,
    }


def test_cleanup_main_ns_ko(mocker, core_api_mock):
    # Mock the Kubernetes API response
    mocker.patch("commands.upgrade._delete_resources")
    mock_ns = MagicMock(V1Namespace)
    core_api_mock.read_namespace.return_value = mock_ns
    core_api_mock.patch_namespace.side_effect = ApiException("API error")

    # Call the function
    with pytest.raises(ResourcePatchError):
        cleanup_main_ns()


def test_cleanup_kubelet_csr_approver_ok(app_api_mock, core_api_mock, rbac_api_mock):
    # Mock the Kubernetes API response
    mock_dummy_secret = Mock(V1Secret)
    mock_dummy_secret.metadata.name = KUBELET_CSR_APPROVER_NAME
    mock_secrets = MagicMock(V1SecretList)
    mock_secrets.items = [mock_dummy_secret]
    core_api_mock.list_namespaced_secret.return_value = mock_secrets

    # Call the function
    cleanup_kubelet_csr_approver()

    # Assert the result
    assert core_api_mock.delete_namespaced_service_account.call_count == 1
    assert core_api_mock.list_namespaced_secret.call_count == 1
    assert core_api_mock.delete_namespaced_secret.call_count == 1
    assert app_api_mock.delete_namespaced_deployment.call_count == 1
    assert rbac_api_mock.delete_cluster_role.call_count == 1
    assert rbac_api_mock.delete_cluster_role_binding.call_count == 1


def test_cleanup_kubelet_csr_approver_ko(app_api_mock):
    # Mock the Kubernetes API response
    app_api_mock.delete_namespaced_deployment.side_effect = ApiException("API error")

    # Call the function
    with pytest.raises(ResourceDeletionError):
        cleanup_kubelet_csr_approver()


def test_cleanup_kubelet_csr_approver_missing(app_api_mock):
    # Mock the Kubernetes API response
    app_api_mock.delete_namespaced_deployment.side_effect = ApiException(status=404)

    # Call the function
    cleanup_kubelet_csr_approver()


def test_relabel_pv_ok(storage_api_mock, core_api_mock):
    # Mock the Kubernetes API response
    mock_pv = MagicMock(V1PersistentVolume)
    mock_pv.metadata.annotations = None
    core_api_mock.read_persistent_volume.return_value = mock_pv

    mock_pvc = MagicMock(V1PersistentVolumeClaim)
    mock_pvc.metadata.annotations = None
    core_api_mock.read_namespaced_persistent_volume_claim.return_value = mock_pvc

    mock_sc = MagicMock(V1StorageClass)
    mock_sc.metadata.annotations = None
    storage_api_mock.read_storage_class.return_value = mock_sc

    # Call the function
    relabel_pv()

    # Assert the result
    assert core_api_mock.read_persistent_volume.call_count == 1
    assert core_api_mock.patch_persistent_volume.call_count == 1
    assert mock_pv.metadata.annotations == {"meta.helm.sh/release-name": PV_CHART}
    assert core_api_mock.read_namespaced_persistent_volume_claim.call_count == 1
    assert core_api_mock.patch_namespaced_persistent_volume_claim.call_count == 1
    assert mock_pvc.metadata.annotations == {"meta.helm.sh/release-name": PV_CHART}
    assert storage_api_mock.read_storage_class.call_count == 1
    assert storage_api_mock.patch_storage_class.call_count == 1
    assert mock_sc.metadata.annotations == {"meta.helm.sh/release-name": PV_CHART}


def test_relabel_pv_ko(storage_api_mock, core_api_mock):
    # Mock the Kubernetes API response
    core_api_mock.patch_persistent_volume.side_effect = ApiException("API error")

    # Call the function
    with pytest.raises(ResourcePatchError):
        relabel_pv()


def test_cleanup_kafka_pv_ok():
    # Prepare for mock
    mock_config = UpgradeConfig()
    mock_config.data_folder.value = "/dummy"

    # Call the function
    with patch("builtins.open", new_callable=mock_open):
        cleanup_kafka_pv(config=mock_config)


def test_cleanup_kafka_pv_ko(mocker):
    # Prepare for mock
    mock_config = UpgradeConfig()
    mock_config.data_folder.value = "/dummy"
    mocker.patch(
        "commands.upgrade.subprocess_run",
        side_effect=subprocess.CalledProcessError(returncode=127, cmd=["fake command"]),
    )

    # Call the function
    with patch("builtins.open", new_callable=mock_open):
        with pytest.raises(KafkaPVRemovalError):
            cleanup_kafka_pv(config=mock_config)


def test_cleanup_platform_ok(mocker, core_api_mock, rbac_api_mock, extension_api_mock):
    # Mock the Kubernetes API response
    mock_resource_deletion = mocker.patch("commands.upgrade._delete_resources")
    # Cluster Roles
    mock_cr_1 = MagicMock(V1ClusterRole)
    mock_cr_1.metadata.name = "dummy-cr-1"
    mock_cr_2 = MagicMock(V1ClusterRole)
    mock_cr_2.metadata.name = "dummy-dex"
    mock_cr_3 = MagicMock(V1ClusterRole)
    mock_cr_3.metadata.name = "istio"
    mock_cr_list = MagicMock(V1ClusterRoleList)
    mock_cr_list.items = [mock_cr_1, mock_cr_2, mock_cr_3]
    rbac_api_mock.list_cluster_role.return_value = mock_cr_list

    # Cluster Role Bindings
    mock_crb_1 = MagicMock(V1ClusterRoleBinding)
    mock_crb_1.metadata.name = "dummy-crb-1"
    mock_crb_2 = MagicMock(V1ClusterRoleBinding)
    mock_crb_2.metadata.name = "dummy-crb-2"
    mock_crb_3 = MagicMock(V1ClusterRoleBinding)
    mock_crb_3.metadata.name = "crb-for-flyte"
    mock_crb_list = MagicMock(V1ClusterRoleBindingList)
    mock_crb_list.items = [mock_crb_1, mock_crb_2, mock_crb_3]
    rbac_api_mock.list_cluster_role_binding.return_value = mock_crb_list

    # CRD
    mock_crd_1 = MagicMock(V1CustomResourceDefinition)
    mock_crd_1.spec.group = "dex"
    mock_crd_2 = MagicMock(V1CustomResourceDefinition)
    mock_crd_2.spec.group = "istio"
    mock_crd_3 = MagicMock(V1CustomResourceDefinition)
    mock_crd_3.spec.group = "flyte"
    mock_crd_list = MagicMock(V1CustomResourceDefinitionList)
    mock_crd_list.items = [mock_crd_1, mock_crd_2, mock_crd_3]
    extension_api_mock.list_custom_resource_definition.return_value = mock_crd_list

    # Call the function
    cleanup_platform()

    # Assert the result
    assert mock_resource_deletion.call_count == 2
    assert core_api_mock.delete_namespaced_secret.call_count == 1
    assert rbac_api_mock.delete_cluster_role.call_count == 2
    assert rbac_api_mock.delete_cluster_role_binding.call_count == 1
    assert extension_api_mock.delete_custom_resource_definition.call_count == 3
