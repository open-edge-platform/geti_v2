# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
import subprocess
from dataclasses import dataclass
from unittest.mock import MagicMock

import pytest
import yaml
from install_data import kubeconfig_template

from constants.platform import PLATFORM_NAMESPACE
from k3s.config import K3sConfiguration, k3s_configuration
from k3s.install import (
    K3SInstallationError,
    _adjust_k3s_kubeconfig_server_address,
    _download_script,
    _k3s_ready,
    _run_installer,
    _set_default_namespace,
    install_k3s,
)

EXAMPLE_KUBECONFIG_FILE = {
    "apiVersion": "v1",
    "clusters": [
        {"cluster": {"certificate-authority-data": "example_cert", "server": "example_ip"}, "name": "example_name"}
    ],
    "contexts": [{"context": {"cluster": "example_cluster", "user": "default_user"}}],
}


@pytest.fixture
def create_tmp_kubeconfig(tmp_path, mocker):
    test_dir = tmp_path / "test_set_default_namespace"
    test_dir.mkdir()
    with open(test_dir / "k3s-remote.yaml", mode="w") as mock_kubeconfig_remote:
        yaml.safe_dump(EXAMPLE_KUBECONFIG_FILE, mock_kubeconfig_remote)
    mocker.patch("k3s.install.K3S_REMOTE_KUBECONFIG_PATH", test_dir / "k3s-remote.yaml")


def test_download_script(mocker):
    requests_get_mock = mocker.patch("requests.get")
    target_file_mock = mocker.MagicMock()

    _download_script(target_file_mock)

    assert requests_get_mock.call_count == 1
    assert target_file_mock.write.call_count == 1


def test_run_installer(mocker):
    open_mock = mocker.patch("builtins.open")
    mocker.patch("os.makedirs")
    subprocess_run_mock = mocker.patch("k3s.install.subprocess_run")
    k3s_readiness_mock = mocker.patch("k3s.install._k3s_ready", return_value=True)
    fake_script_path = "/fake/script/path"
    fake_logs_dir_path = "/fake/logs/dir/path"

    _run_installer(fake_script_path, fake_logs_dir_path)

    assert open_mock.call_count == 1
    assert subprocess_run_mock.call_count == 1
    assert k3s_readiness_mock.call_count == 1
    assert subprocess_run_mock.call_args[0][0] == fake_script_path
    assert k3s_configuration.to_env_var_dict().items() <= subprocess_run_mock.call_args[1]["env"].items()


@dataclass
class InstallK3SMockingConfiguration:
    run_installer_mock: MagicMock
    shutil_copy2_mock: MagicMock
    os_makedirs_mock: MagicMock
    gzip_open_mock: MagicMock
    open_mock: MagicMock
    shutil_copyfileobj_mock: MagicMock
    os_chmod_mock: MagicMock
    os_remove_mock: MagicMock
    fake_logs_dir_path: str
    adjust_k3s_kubeconfig_server_address_mock: MagicMock
    set_default_namespace_mock: MagicMock


@pytest.fixture
def mock_install_k3s(mocker) -> InstallK3SMockingConfiguration:
    return InstallK3SMockingConfiguration(
        run_installer_mock=mocker.patch("k3s.install._run_installer"),
        shutil_copy2_mock=mocker.patch("shutil.copy2"),
        os_makedirs_mock=mocker.patch("os.makedirs"),
        gzip_open_mock=mocker.patch("gzip.open"),
        open_mock=mocker.patch("builtins.open"),
        shutil_copyfileobj_mock=mocker.patch("shutil.copyfileobj"),
        os_chmod_mock=mocker.patch("os.chmod"),
        os_remove_mock=mocker.patch("os.remove"),
        fake_logs_dir_path="/fake/logs/dir/path",
        adjust_k3s_kubeconfig_server_address_mock=mocker.patch("k3s.install._adjust_k3s_kubeconfig_server_address"),
        set_default_namespace_mock=mocker.patch("k3s.install._set_default_namespace"),
    )


def test_install_k3s(mocker, mock_install_k3s):
    update_containerd_config_mock = mocker.patch("k3s.install._update_containerd_config")
    mark_k3s_install_mock = mocker.patch("k3s.install._mark_k3s_installation")
    install_k3s(mock_install_k3s.fake_logs_dir_path)

    assert mock_install_k3s.run_installer_mock.call_count == 1
    assert update_containerd_config_mock.call_count == 1
    assert mark_k3s_install_mock.call_count == 1
    assert mock_install_k3s.adjust_k3s_kubeconfig_server_address_mock.call_count == 1
    assert mock_install_k3s.set_default_namespace_mock.call_count == 1


def test_install_k3s_process_error(mock_install_k3s):
    mock_install_k3s.run_installer_mock.side_effect = subprocess.CalledProcessError(returncode=22, cmd="fake command")
    with pytest.raises(K3SInstallationError):
        install_k3s(mock_install_k3s.fake_logs_dir_path)


localhost_kubeconfig_str = kubeconfig_template.format(server_address="127.0.0.1")
localhost_kubeconfig = yaml.safe_load(localhost_kubeconfig_str)


def test_adjust_k3s_kubeconfig_server_address(mocker):
    fake_host_ip = "10.0.2.15"
    get_first_nonlocal_host_ip_mock = mocker.patch("k3s.install.get_first_public_ip", return_value=fake_host_ip)
    mocker.patch("builtins.open")
    mocker.patch("shutil.copy2")

    mocker.patch("yaml.safe_load", return_value=localhost_kubeconfig)
    yaml_dump_mock = mocker.patch("yaml.dump")

    expected_kubeconfig = yaml.safe_load(kubeconfig_template.format(server_address=fake_host_ip))

    _adjust_k3s_kubeconfig_server_address()

    assert get_first_nonlocal_host_ip_mock.call_count == 1
    assert yaml_dump_mock.call_args[0][0] == expected_kubeconfig


def test_adjust_k3s_kubeconfig_server_address_none(mocker):
    get_first_nonlocal_host_ip_mock = mocker.patch("k3s.install.get_first_public_ip", return_value=None)
    open_mock = mocker.patch("builtins.open")
    yaml_safe_load_mock = mocker.patch("yaml.safe_load", return_value=localhost_kubeconfig)
    yaml_dump_mock = mocker.patch("yaml.dump")

    _adjust_k3s_kubeconfig_server_address()

    assert get_first_nonlocal_host_ip_mock.call_count == 1
    assert yaml_dump_mock.call_count == 0
    assert open_mock.call_count == 0
    assert yaml_safe_load_mock.call_count == 0


def test_k3s_configuration():
    config = K3sConfiguration(version="v2.3.4")
    config.disable_components.append("traefik")
    config.disable_components.append("kube-server")

    config.kube_scheduler_args["bind-address"] = "127.0.0.1"
    config.kube_apiserver_args["enable-admission-plugins"] = "NodeRestriction,PodSecurityPolicy,ServiceAccount"
    config.kube_controller_manager_args["leader-elect-lease-duration"] = "30s"

    dict_config = config.to_env_var_dict()

    assert dict_config == {
        "INSTALL_K3S_VERSION": "v2.3.4",
        "INSTALL_K3S_SKIP_DOWNLOAD": "true",
        "INSTALL_K3S_EXEC": "--disable traefik "
        "--disable kube-server "
        "--kube-apiserver-arg=enable-admission-plugins=NodeRestriction,"
        "PodSecurityPolicy,ServiceAccount "
        "--kube-controller-manager-arg=leader-elect-lease-duration=30s "
        "--kube-scheduler-arg=bind-address=127.0.0.1 ",
    }


def test_set_default_namespace(create_tmp_kubeconfig, tmp_path):
    _set_default_namespace()
    test_dir = tmp_path / "test_set_default_namespace"
    with open(test_dir / "k3s-remote.yaml") as kubeconfig_remote_file:
        kubeconfig_remote = yaml.safe_load(kubeconfig_remote_file)
    assert kubeconfig_remote["contexts"][0]["context"]["namespace"] == PLATFORM_NAMESPACE


def test_for_k3s_ready_success(mocker):
    mock_run = mocker.patch(
        "subprocess.run", return_value=MagicMock(stdout="node-ip   Ready    control-plane,master   24m   v1.31.0+k3s1")
    )

    mocker.patch("time.time", side_effect=list(range(0, 30, 10)))
    mock_sleep = mocker.patch("time.sleep")

    result = _k3s_ready(time_wait=30)
    assert result is True
    assert mock_run.call_count == 1
    assert mock_sleep.call_count == 0


def test_for_k3s_ready_failure(mocker):
    mock_run = mocker.patch("subprocess.run", return_value=MagicMock(stdout=""))

    mocker.patch("time.time", side_effect=list(range(0, 400, 10)))
    mocker.patch("time.sleep")

    result = _k3s_ready(time_wait=300)
    assert result is False
    assert mock_run.call_count > 20
