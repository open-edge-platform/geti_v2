# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
from unittest import mock
from unittest.mock import Mock

import pytest
import requests

from configuration_models.install_config import InstallationConfig
from platform_stages.steps.errors import DownloadSystemPackagesError
from platform_stages.steps.install_system_packages import (
    _download_packages,
    _parse_system_packages,
    install_system_packages,
)

SYSTEM_PACKAGES_YAML = """
shared:
  packages:
    - name: helm
      destination: tools
      urls:
        - https://get.helm.sh/helm-v3.16.1-linux-amd64.tar.gz
    - name: k3s
      destination: tools/k3s
      urls:
        - https://github.com/k3s-io/k3s/releases/download/v1.31.0+k3s1/k3s
        - https://github.com/k3s-io/k3s/releases/download/v1.31.0+k3s1/k3s-airgap-images-amd64.tar.gz
        - https://raw.githubusercontent.com/k3s-io/k3s/refs/tags/v1.31.0+k3s1/install.sh
ubuntu:
  packages:
    - name: pigz
      destination: tools/Ubuntu
      urls:
        - https://archive.ubuntu.com/ubuntu/pool/universe/p/pigz/pigz_2.4-1_amd64.deb
    - name: nvidia
      destination: tools/Ubuntu/nvidia
      urls:
        - https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2004/x86_64/nvidia-container-toolkit-base_1.17.8-1_amd64.deb
        - https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2004/x86_64/nvidia-container-toolkit_1.17.8-1_amd64.deb
        - https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2004/x86_64/libnvidia-container1_1.17.8-1_amd64.deb
        - https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2004/x86_64/libnvidia-container-tools_1.17.8-1_amd64.deb
redhat:
  packages:
    - name: pigz
      destination: tools/RedHat
      urls:
        - https://mirror.stream.centos.org/9-stream/BaseOS/x86_64/os/Packages/pigz-2.5-4.el9.x86_64.rpm
    - name: nvidia
      destination: tools/RedHat/nvidia
      urls:
        - https://developer.download.nvidia.com/compute/cuda/repos/rhel9/x86_64/nvidia-container-toolkit-base-1.17.8-1.x86_64.rpm
        - https://developer.download.nvidia.com/compute/cuda/repos/rhel9/x86_64/nvidia-container-toolkit-1.17.8-1.x86_64.rpm
        - https://developer.download.nvidia.com/compute/cuda/repos/rhel9/x86_64/libnvidia-container1-1.17.8-1.x86_64.rpm
        - https://developer.download.nvidia.com/compute/cuda/repos/rhel9/x86_64/ibnvidia-container-tools-1.17.8-1.x86_64.rpm
    - name: k3s-selinux
      destination: tools/RedHat/k3s-selinux
      urls:
        - https://github.com/k3s-io/k3s-selinux/releases/download/v1.6.stable.1/k3s-selinux-1.6-1.el9.noarch.rpm
"""


@pytest.fixture
def mock_open(mocker):
    mock_open = mocker.patch("builtins.open", mocker.MagicMock())
    mock_open.return_value = mock.mock_open(read_data=SYSTEM_PACKAGES_YAML).return_value
    return mock_open


@pytest.fixture
def mock_requests_get(mocker):
    mock_requests_get = mocker.patch("platform_stages.steps.install_system_packages.requests.get")
    mock_response = Mock()
    mock_response.status_code = 200
    mock_response.iter_content.return_value = [b"chunk1", b"chunk2"]
    mock_requests_get.return_value = mock_response
    return mock_requests_get


@pytest.fixture
def mock_os_makedirs(mocker):
    return mocker.patch("platform_stages.steps.install_system_packages.os.makedirs")


@pytest.fixture
def mock_tarfile_open(mocker):
    return mocker.patch("platform_stages.steps.install_system_packages.tarfile.open")


@pytest.fixture
def mock_shutil_rmtree(mocker):
    return mocker.patch("platform_stages.steps.install_system_packages.shutil.rmtree")


@pytest.fixture
def mock_subprocess_run(mocker):
    return mocker.patch("platform_stages.steps.install_system_packages.subprocess_run")


@pytest.mark.parametrize("os_name", ["Red Hat", "Ubuntu"])
def test_parse_system_packages(mock_open, os_name):
    os_name_converted = f"{os_name.replace(' ', '').lower()}"
    system_packages = _parse_system_packages(os_name_converted)

    assert system_packages["shared"]["packages"][0]["urls"][0] == "https://get.helm.sh/helm-v3.16.1-linux-amd64.tar.gz"
    assert system_packages["shared"]["packages"][0]["destination"] == "tools"
    assert system_packages[os_name_converted]["packages"][0]["destination"] == f"tools/{os_name.replace(' ', '')}"

    if os_name == "Red Hat":
        assert "k3s-selinux" in (package["name"] for package in system_packages[os_name_converted]["packages"])
    else:
        assert "k3s-selinux" not in (package["name"] for package in system_packages[os_name_converted]["packages"])


@pytest.mark.parametrize("os_name", ["Red Hat", "Ubuntu"])
def test_download_packages(
    mock_open, mock_os_makedirs, mock_requests_get, mock_tarfile_open, mock_shutil_rmtree, os_name
):
    os_name_converted = f"{os_name.replace(' ', '').lower()}"
    system_packages = _parse_system_packages(os_name_converted)
    _download_packages(system_packages)

    if os_name == "Red Hat":
        assert mock_os_makedirs.call_count == 5
        assert mock_requests_get.call_count == 10
    else:
        assert mock_os_makedirs.call_count == 4
        assert mock_requests_get.call_count == 9

    assert mock_tarfile_open.call_count == 1
    assert mock_shutil_rmtree.call_count == 1


@pytest.mark.parametrize("os_name", ["Red Hat", "Ubuntu"])
def test_download_packages_failed(
    mock_open, mock_os_makedirs, mock_requests_get, mock_tarfile_open, mock_shutil_rmtree, os_name
):
    mock_requests_get.side_effect = requests.exceptions.RequestException

    os_name_converted = f"{os_name.replace(' ', '').lower()}"
    system_packages = _parse_system_packages(os_name_converted)

    with pytest.raises(DownloadSystemPackagesError):
        _download_packages(system_packages)

    # 1 package (due to side effect) with 3 attempts
    assert mock_os_makedirs.call_count == 1
    assert mock_requests_get.call_count == 3

    assert mock_tarfile_open.call_count == 0
    assert mock_shutil_rmtree.call_count == 0


@pytest.mark.parametrize("os_name", ["Red Hat", "Ubuntu"])
def test_install_system_packages(
    mock_open, mock_os_makedirs, mock_requests_get, mock_tarfile_open, mock_shutil_rmtree, mock_subprocess_run, os_name
):
    config = InstallationConfig(interactive_mode=False, install_telemetry_stack=False)
    config.local_os.value = os_name

    install_system_packages(config)

    if os_name == "Red Hat":
        assert mock_os_makedirs.call_count == 5
        assert mock_requests_get.call_count == 10
    else:
        assert mock_os_makedirs.call_count == 4
        assert mock_requests_get.call_count == 9

    assert mock_tarfile_open.call_count == 1
    assert mock_shutil_rmtree.call_count == 1

    assert mock_subprocess_run.call_count == 1


@pytest.mark.parametrize("os_name", ["Red Hat", "Ubuntu"])
def test_install_system_packages_failed(
    mock_open, mock_os_makedirs, mock_requests_get, mock_tarfile_open, mock_shutil_rmtree, mock_subprocess_run, os_name
):
    mock_requests_get.side_effect = requests.exceptions.RequestException

    config = InstallationConfig(interactive_mode=False, install_telemetry_stack=False)
    config.local_os.value = os_name

    with pytest.raises(DownloadSystemPackagesError):
        install_system_packages(config)

    # 1 package (due to side effect) with 3 attempts
    assert mock_os_makedirs.call_count == 1
    assert mock_requests_get.call_count == 3

    assert mock_tarfile_open.call_count == 0
    assert mock_shutil_rmtree.call_count == 1

    assert mock_subprocess_run.call_count == 0
