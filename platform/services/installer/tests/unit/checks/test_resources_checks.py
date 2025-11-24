# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import math
from collections import namedtuple
from unittest.mock import MagicMock, mock_open

import pytest

from checks.errors import (
    CheckIgnored,
    CheckSkipped,
    K8SCheckError,
    ResourcesCheckError,
    ResourcesCheckWarning,
    UnsupportedGpuWarning,
)
from checks.resources import (
    GPU_PROVIDER_INTEL_ARC,
    GPU_PROVIDER_INTEL_ARC_A,
    GPU_PROVIDER_INTEL_MAX,
    SUPPORTED_NVIDIA_DRIVER_VERSION,
    _get_intel_gpus,
    check_gpu_driver_version,
    check_local_cpu,
    check_local_disk,
    check_local_gpu,
    check_local_gpu_driver,
    check_local_mem,
    check_upgrade_storage_requirements,
)
from configuration_models.install_config import InstallationConfig
from configuration_models.upgrade_config import UpgradeConfig
from texts.checks import ResourcesChecksTexts

arc_xe_description = """    03:00.0 Display controller [0380]: Intel Corporation Device [8086:e216]
            Subsystem: Intel Corporation Device [8086:1500]
            Kernel driver in use: xe
            Kernel modules: xe"""

arc_i915_description = """    03:00.0 Display controller [0380]: Intel Corporation Device [8086:e216]
            Subsystem: Intel Corporation Device [8086:1500]
            Kernel driver in use: i915
            Kernel modules: i915"""

igpu_description = """00:02.0 VGA compatible controller [0300]: Intel Corporation Raptor Lake-S GT1 [UHD Graphics 770] [8086:a780] (rev 04)
            DeviceName: Onboard IGD
            Subsystem: ASUSTeK Computer Inc. Raptor Lake-S GT1 [UHD Graphics 770] [1043:8882]
            Kernel driver in use: i915"""

nvidia_description = """08:00.0 VGA compatible controller [0300]: NVIDIA Corporation GA102 [GeForce RTX 3090] [10de:2204] (rev a1)
            Subsystem: Gigabyte Technology Co., Ltd GA102 [GeForce RTX 3090] [1458:4043]
            Kernel driver in use: nouveau
            Kernel modules: nvidiafb, nouveau"""

arc_xe_igpu_description = arc_xe_description + "\n--\n" + igpu_description

arc_i915_igpu_description = arc_i915_description + "\n--\n" + igpu_description

arc_xe_nvidia_description = arc_xe_description + "\n--\n" + nvidia_description

nvidia_igpu_description = nvidia_description + "\n--\n" + igpu_description


def test_check_local_cpu(mocker):
    """Check if the requirement for 12 physical cores passes successfully"""
    mocker.patch("checks.resources.PLATFORM_CPU_CORES_MIN", 20)
    test_mock = mocker.patch("checks.resources.cpu_count", return_value=20)
    check_local_cpu()

    assert test_mock.call_count == 1


def test_check_local_cpu_failed(mocker):
    test_mock = mocker.patch("checks.resources.cpu_count", return_value=48)
    mocker.patch("checks.resources.PLATFORM_CPU_CORES_MIN", 96)
    with pytest.raises(ResourcesCheckError):
        check_local_cpu()

    assert test_mock.call_count == 1


def test_check_local_gpu_driver(mocker):
    os_path_isfile_mock = mocker.patch("os.path.isfile")
    os_path_isfile_mock.return_value = True
    check_local_gpu_driver(gpu_support=True)
    assert os_path_isfile_mock.call_count == 1


def test_check_local_gpu_driver_not_installed(mocker):
    os_path_isfile_mock = mocker.patch("os.path.isfile")
    os_path_isfile_mock.return_value = False
    with pytest.raises(ResourcesCheckError):
        check_local_gpu_driver(gpu_support=True)
    assert os_path_isfile_mock.call_count == 1


def test_check_local_gpu_driver_skipped():
    with pytest.raises(CheckSkipped):
        check_local_gpu_driver(gpu_support=False)


@pytest.fixture
def get_gpus_mock(mocker):
    return mocker.patch("checks.resources._get_nvidia_gpus")


@pytest.fixture
def get_intel_gpus_mock(mocker):
    return mocker.patch("checks.resources._get_intel_gpus")


def test_check_local_nvidia_gpu_ok(get_gpus_mock):
    gpu_mock = {
        "name": "NVIDIA GeForce RTX 3090",
        "memory_total": 24576,
    }
    get_gpus_mock.return_value = [gpu_mock, gpu_mock]
    install_config_mock = InstallationConfig(interactive_mode=False, install_telemetry_stack=False)
    install_config_mock.gpu_support.value = True
    check_local_gpu(config=install_config_mock)
    assert get_gpus_mock.call_count == 1
    assert install_config_mock.gpu_provider.value == "nvidia"


def test_get_intel_gpus_max_card(mocker):
    sub_process_mock = mocker.patch(
        "subprocess.check_output", return_value=ResourcesChecksTexts.intel_gpu_max_card.encode("utf-8")
    )
    gpus, _ = _get_intel_gpus()

    assert GPU_PROVIDER_INTEL_MAX in gpus
    assert sub_process_mock.call_count == 1


def test_get_intel_gpus_arc_xe_card(mocker):
    sub_process_mock = mocker.patch("subprocess.check_output", return_value=arc_xe_description.encode("utf-8"))
    check_intel_gpu_driver_mock = mocker.patch("checks.resources._check_intel_gpu_driver", return_value=True)

    gpus, isdGPU = _get_intel_gpus()

    assert GPU_PROVIDER_INTEL_ARC in gpus
    assert isdGPU is True
    assert check_intel_gpu_driver_mock.call_count == 1
    assert sub_process_mock.call_count == 2


def test_get_intel_gpus_arc_i915_card(mocker):
    sub_process_mock = mocker.patch("subprocess.check_output", return_value=arc_i915_description.encode("utf-8"))
    check_intel_gpu_driver_mock = mocker.patch("checks.resources._check_intel_gpu_driver", return_value=True)

    gpus, isdGPU = _get_intel_gpus()

    assert GPU_PROVIDER_INTEL_ARC_A in gpus
    assert isdGPU is True
    assert check_intel_gpu_driver_mock.call_count == 1
    assert sub_process_mock.call_count == 2


def test_get_intel_gpus_arc_igpu_card(mocker):
    sub_process_mock = mocker.patch("subprocess.check_output", return_value=arc_i915_igpu_description.encode("utf-8"))
    check_intel_gpu_driver_mock = mocker.patch("checks.resources._check_intel_gpu_driver", return_value=True)

    gpus, isdPGU = _get_intel_gpus()

    assert GPU_PROVIDER_INTEL_ARC_A in gpus
    assert isdPGU is True
    assert check_intel_gpu_driver_mock.call_count == 1
    assert sub_process_mock.call_count == 2


def test_get_intel_gpus_igpu_card(mocker):
    sub_process_mock = mocker.patch("subprocess.check_output", return_value=igpu_description.encode("utf-8"))
    check_intel_gpu_driver_mock = mocker.patch("checks.resources._check_intel_gpu_driver", return_value=True)

    gpus, isdPGU = _get_intel_gpus()

    assert GPU_PROVIDER_INTEL_ARC_A in gpus
    assert isdPGU is False
    assert check_intel_gpu_driver_mock.call_count == 1
    assert sub_process_mock.call_count == 2


def test_check_local_nvidia_arc(mocker):
    get_intel_mock = mocker.patch("checks.resources._get_intel_gpus", return_value=(GPU_PROVIDER_INTEL_ARC, True))
    get_nvidia_mock = mocker.patch(
        "checks.resources._get_nvidia_gpus",
        return_value=[
            {
                "name": "NVIDIA GeForce RTX 3090",
                "memory_total": 24576,
            }
        ],
    )

    install_config_mock = InstallationConfig(interactive_mode=False, install_telemetry_stack=False)
    install_config_mock.gpu_support.value = True
    check_local_gpu(config=install_config_mock)
    assert get_intel_mock.call_count == 1
    assert get_nvidia_mock.call_count == 1
    assert install_config_mock.gpu_provider.value == GPU_PROVIDER_INTEL_ARC


def test_check_local_nvidia_igpu(mocker):
    get_intel_mock = mocker.patch("checks.resources._get_intel_gpus", return_value=(GPU_PROVIDER_INTEL_ARC, False))
    get_nvidia_mock = mocker.patch(
        "checks.resources._get_nvidia_gpus",
        return_value=(
            [
                {
                    "name": "NVIDIA GeForce RTX 3090",
                    "memory_total": 24576,
                }
            ]
        ),
    )

    install_config_mock = InstallationConfig(interactive_mode=False, install_telemetry_stack=False)
    install_config_mock.gpu_support.value = True
    check_local_gpu(config=install_config_mock)
    assert get_intel_mock.call_count == 1
    assert get_nvidia_mock.call_count == 1
    assert install_config_mock.gpu_provider.value == "nvidia"


def test_get_intel_gpus_no_card(mocker):
    sub_process_mock = mocker.patch("subprocess.check_output", return_value=b"lack of Intel gpu")

    gpus = _get_intel_gpus()

    assert not gpus[0]
    assert sub_process_mock.call_count == 2


def test_check_local_gpu_not_supported(get_gpus_mock):
    gpu_mock_1 = {
        "name": "Fake Unsupported GPU",
        "memory_total": 15000,
    }
    gpu_mock_2 = {
        "name": "NVIDIA GeForce RTX 3090",
        "memory_total": 24576,
    }
    get_gpus_mock.return_value = [gpu_mock_1, gpu_mock_2]
    with pytest.raises(UnsupportedGpuWarning):
        install_config_mock = InstallationConfig(interactive_mode=False, install_telemetry_stack=False)
        check_local_gpu(config=install_config_mock)
    assert get_gpus_mock.call_count == 1


def test_check_local_gpu_get_gpus_bug(get_gpus_mock):
    get_gpus_mock.side_effect = ValueError
    with pytest.raises(ResourcesCheckWarning):
        install_config_mock = InstallationConfig(interactive_mode=False, install_telemetry_stack=False)
        check_local_gpu(config=install_config_mock)
    assert get_gpus_mock.call_count == 1


def test_check_local_gpu_skipped():
    with pytest.raises(CheckSkipped):
        install_config_mock = InstallationConfig(interactive_mode=False, install_telemetry_stack=False)
        install_config_mock.gpu_support.value = False
        check_local_gpu(config=install_config_mock)


def test_check_local_mem(mocker):
    mem_mock = mocker.patch("checks.resources.virtual_memory")
    mocker.patch("checks.resources.PLATFORM_MEMORY_MIN", 48)
    mem_mock.return_value.total = math.pow(1000, 3) * 196
    check_local_mem()

    assert mem_mock.call_count == 1


def test_check_local_mem_failed(mocker):
    mem_mock = mocker.patch("checks.resources.virtual_memory")
    mem_mock.return_value.total = math.pow(1000, 3) * 196
    mocker.patch("checks.resources.PLATFORM_MEMORY_MIN", 256)
    with pytest.raises(ResourcesCheckWarning):
        check_local_mem()

    assert mem_mock.call_count == 1


def test_check_local_disk(mocker):
    mocker.patch("checks.resources.PLATFORM_DISK_MIN", 500)
    disk_mock = mocker.patch("checks.resources.disk_partitions")
    sdiskpart = namedtuple("sdiskpart", ["mountpoint"])
    disk_mock.return_value = [sdiskpart(mountpoint="/")]
    disk_usage = mocker.patch("checks.resources.disk_usage")
    disk_usage.return_value.free = math.pow(1024, 3) * 1000
    check_local_disk()

    assert disk_mock.call_count == 1
    assert disk_usage.call_count == 2


def test_check_local_disk_failed(mocker):
    disk_mock = mocker.patch("checks.resources.disk_partitions")
    sdiskpart = namedtuple("sdiskpart", ["mountpoint"])
    disk_mock.return_value = [sdiskpart(mountpoint="/")]
    disk_usage = mocker.patch("checks.resources.disk_usage")
    disk_usage.return_value.free = math.pow(1024, 3) * 50
    with pytest.raises(ResourcesCheckError):
        check_local_disk()

    assert disk_mock.call_count == 1
    assert disk_usage.call_count == 1


def test_check_local_disk_reqs_changed(mocker):
    disk_mock = mocker.patch("checks.resources.disk_partitions")
    sdiskpart = namedtuple("sdiskpart", ["mountpoint"])
    disk_mock.return_value = [sdiskpart(mountpoint="/")]
    disk_usage = mocker.patch("checks.resources.disk_usage")
    disk_usage.return_value.free = math.pow(1024, 3) * 100
    mocker.patch("checks.resources.PLATFORM_DISK_MIN", 20)
    check_local_disk()

    assert disk_mock.call_count == 1
    assert disk_usage.call_count == 2


@pytest.fixture()
def mock_config_and_k8s(mocker):
    mocker.patch("builtins.open", mock_open())

    # Mocking configuration
    config = UpgradeConfig(interactive_mode=False, install_telemetry_stack=False)
    config.kube_config.value = "test_kube_config"

    # Mocking kubernetes
    mock_api_instance = MagicMock()
    mock_read_persistent_volume = mocker.patch.object(mock_api_instance, "read_namespaced_config_map")
    mock_read_persistent_volume.return_value.spec.host_path.path = "/test/data_folder_path"
    mocker.patch("kubernetes.client.ApiClient")
    mocker.patch("kubernetes.client.CoreV1Api", return_value=mock_api_instance)
    mocker.patch("kubernetes.config.load_kube_config")
    mock_running_on_k3s = mocker.patch("checks.resources.is_kubernetes_running_on_k3s")
    mock_running_on_k3s.return_value = True

    return config


@pytest.mark.parametrize(["skip_backup", "backup_location"], [(None, None), (False, "/test/backup_path"), (True, None)])
def test_check_upgrade_storage_requirements_sufficient(mocker, mock_config_and_k8s, skip_backup, backup_location):
    # Mocking disk usage
    mock_available_storage_data_folder = MagicMock(stdout="/dev/sda3        5290003 1436538   3586791  29% /")
    mock_used_storage_data_folder = MagicMock(stdout="9537	/root/test")
    mock_subprocess_run = mocker.patch("checks.resources.subprocess.run")
    mock_subprocess_run.side_effect = [mock_available_storage_data_folder, mock_used_storage_data_folder]

    # Mocking user input
    config = mock_config_and_k8s
    config.skip_backup.value = skip_backup
    config.backup_location.value = backup_location

    mock_spinner = mocker.patch("checks.resources.click_spinner.Spinner")
    check_upgrade_storage_requirements(config, mock_spinner)

    assert config.skip_backup.value is False
    assert config.backup_location.value is None


def test_check_upgrade_storage_requirements_insufficient_dont_skip_backup_insufficient(mocker, mock_config_and_k8s):
    # Mocking disk usage
    mock_available_storage_data_folder = MagicMock(stdout="/dev/sda3        5290003 1436538   3586791  29% /")
    mock_used_storage_data_folder = MagicMock(stdout="5230000	/root/test")
    mock_available_storage_backup_location = MagicMock(stdout="/dev/sda3      5416962 3781609 1362278  74% /")
    mock_subprocess_run = mocker.patch("checks.resources.subprocess.run")
    mock_subprocess_run.side_effect = [
        mock_available_storage_data_folder,
        mock_used_storage_data_folder,
        mock_available_storage_backup_location,
    ]

    # Mocking user input
    config = mock_config_and_k8s
    config.skip_backup.value = False
    config.backup_location.value = "/test/backup_path"

    mock_spinner = mocker.patch("checks.resources.click_spinner.Spinner")
    with pytest.raises(K8SCheckError):
        check_upgrade_storage_requirements(config, mock_spinner)


def test_check_upgrade_storage_requirements_insufficient_dont_skip_backup_sufficient(mocker, mock_config_and_k8s):
    # Mocking disk usage
    mock_available_storage_data_folder = MagicMock(stdout="/dev/sda3        5290003 1436538   3586791  29% /")
    mock_used_storage_data_folder = MagicMock(stdout="4046791	/root/test")
    mock_available_storage_backup_location = MagicMock(stdout="/dev/sda3        6023329 1436538   4586791  24% /")
    mock_subprocess_run = mocker.patch("checks.resources.subprocess.run")
    mock_subprocess_run.side_effect = [
        mock_available_storage_data_folder,
        mock_used_storage_data_folder,
        mock_available_storage_backup_location,
    ]

    # Mocking user input
    config = mock_config_and_k8s
    config.skip_backup.value = False
    config.backup_location.value = "/test/backup_path"

    mock_spinner = mocker.patch("checks.resources.click_spinner.Spinner")
    check_upgrade_storage_requirements(config, mock_spinner)

    assert config.skip_backup.value is False
    assert config.backup_location.value == "/test/backup_path"


def test_check_upgrade_storage_requirements_insufficient_skip_backup(mocker, mock_config_and_k8s):
    # Mocking disk usage
    mock_available_storage_data_folder = MagicMock(stdout="/dev/sda3        5290003 1436538   3586791  29% /")
    mock_used_storage_data_folder = MagicMock(stdout="5230000	/root/test")
    mock_subprocess_run = mocker.patch("checks.resources.subprocess.run")
    mock_subprocess_run.side_effect = [
        mock_available_storage_data_folder,
        mock_used_storage_data_folder,
    ]

    # Mocking user input
    config = mock_config_and_k8s
    config.skip_backup.value = True
    config.backup_location.value = None

    mock_spinner = mocker.patch("checks.resources.click_spinner.Spinner")
    with pytest.raises(CheckIgnored):
        check_upgrade_storage_requirements(config, mock_spinner)


def test_check_upgrade_storage_requirements_insufficient_skip_backup_not_set(mocker, mock_config_and_k8s):
    # Mocking disk usage
    mock_available_storage_data_folder = MagicMock(stdout="/dev/sda3        5290003 1436538   3586791  29% /")
    mock_used_storage_data_folder = MagicMock(stdout="5230000	/root/test")
    mock_subprocess_run = mocker.patch("checks.resources.subprocess.run")
    mock_subprocess_run.side_effect = [
        mock_available_storage_data_folder,
        mock_used_storage_data_folder,
    ]

    # Mocking user input
    config = mock_config_and_k8s
    config.skip_backup.value = None
    config.backup_location.value = None

    mock_spinner = mocker.patch("checks.resources.click_spinner.Spinner")
    with pytest.raises(K8SCheckError):
        check_upgrade_storage_requirements(config, mock_spinner)


def test_check_upgrade_storage_requirements_not_running_on_k3s(mocker, mock_config_and_k8s):
    mock_running_on_k3s = mocker.patch("checks.resources.is_kubernetes_running_on_k3s")
    mock_running_on_k3s.return_value = False

    mock_spinner = mocker.patch("checks.resources.click_spinner.Spinner")
    config = mock_config_and_k8s
    with pytest.raises(CheckSkipped):
        check_upgrade_storage_requirements(config, mock_spinner)


def test_check_gpu_driver_version(mocker):
    mock_check_output = mocker.patch("subprocess.check_output", return_value=b"525.147.05")
    install_config_mock = InstallationConfig(interactive_mode=False, install_telemetry_stack=False)
    install_config_mock.gpu_support.value = True
    install_config_mock.gpu_provider.value = "nvidia"
    check_gpu_driver_version(config=install_config_mock)
    assert mock_check_output.call_count == 1


def test_check_gpu_driver_version_multiple_gpus(mocker):
    mock_check_output = mocker.patch("subprocess.check_output", return_value=b"""525.147.05\n525.147.05""")
    install_config_mock = InstallationConfig(interactive_mode=False, install_telemetry_stack=False)
    install_config_mock.gpu_support.value = True
    install_config_mock.gpu_provider.value = "nvidia"
    check_gpu_driver_version(config=install_config_mock)
    assert mock_check_output.call_count == 1


def test_check_gpu_driver_version_multiple_gpus_one_not_supported(mocker):
    mock_check_output = mocker.patch("subprocess.check_output", return_value=b"""525.147.05\n505.147.05""")
    install_config_mock = InstallationConfig(interactive_mode=False, install_telemetry_stack=False)
    install_config_mock.gpu_support.value = True
    install_config_mock.gpu_provider.value = "nvidia"
    with pytest.raises(ResourcesCheckError):
        check_gpu_driver_version(config=install_config_mock)
    assert mock_check_output.call_count == 1


def test_check_gpu_driver_version_multiple_gpus_both_not_supported(mocker):
    mock_check_output = mocker.patch("subprocess.check_output", return_value=b"""502.147.05\n505.147.05""")
    install_config_mock = InstallationConfig(interactive_mode=False, install_telemetry_stack=False)
    install_config_mock.gpu_support.value = True
    install_config_mock.gpu_provider.value = "nvidia"
    with pytest.raises(ResourcesCheckError):
        check_gpu_driver_version(config=install_config_mock)
    assert mock_check_output.call_count == 1


def test_check_gpu_driver_version_skipped(mocker):
    mock_check_output = mocker.patch("subprocess.check_output", return_value=b"525.147.05")
    install_config_mock = InstallationConfig(interactive_mode=False, install_telemetry_stack=False)
    install_config_mock.gpu_support.value = False
    with pytest.raises(CheckSkipped):
        check_gpu_driver_version(config=install_config_mock)
    assert mock_check_output.call_count == 0


def test_check_gpu_driver_version_not_supported(mocker):
    mock_check_output = mocker.patch("subprocess.check_output", return_value=b"470.120.10")
    install_config_mock = InstallationConfig(interactive_mode=False, install_telemetry_stack=False)
    install_config_mock.gpu_support.value = True
    install_config_mock.gpu_provider.value = "nvidia"
    with pytest.raises(ResourcesCheckError) as err:
        check_gpu_driver_version(config=install_config_mock)
    assert str(err.value) == ResourcesChecksTexts.gpu_driver_version_check_error.format(
        nvidia_driver_version="470.120.10", supported_nvidia_driver_version=SUPPORTED_NVIDIA_DRIVER_VERSION
    )
    assert mock_check_output.call_count == 1


def test_check_gpu_driver_version_upgrade(mocker):
    mock_check_output = mocker.patch("subprocess.check_output", return_value=b"525.147.05")
    upgrade_config_mock = UpgradeConfig(interactive_mode=False, install_telemetry_stack=False)
    upgrade_config_mock.gpu_support.value = True
    upgrade_config_mock.gpu_provider.value = "nvidia"
    check_gpu_driver_version(config=upgrade_config_mock)
    assert mock_check_output.call_count == 1


def test_check_gpu_driver_version_intel_gpu_upgrade(mocker):
    mock_check_output = mocker.patch("subprocess.check_output")
    upgrade_config_mock = UpgradeConfig(interactive_mode=False, install_telemetry_stack=False)
    upgrade_config_mock.gpu_support.value = True
    upgrade_config_mock.gpu_provider.value = "intel"
    with pytest.raises(CheckSkipped):
        check_gpu_driver_version(config=upgrade_config_mock)
    assert mock_check_output.call_count == 0
