# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

from subprocess import CalledProcessError, TimeoutExpired

import pytest

from checks.errors import CheckSkipped, LocalOSCheckWarning
from checks.os import check_os_version
from configuration_models.install_config import InstallationConfig
from constants.os import SupportedOS


def test_check_os_version_skipped(mocker):
    get_mock = mocker.patch("checks.os.os.environ.get")
    get_mock.return_value = "false"
    install_config_mock = InstallationConfig(interactive_mode=False, install_telemetry_stack=False)
    with pytest.raises(CheckSkipped):
        check_os_version(install_config_mock)

    get_mock.assert_called_with("PLATFORM_CHECK_OS")
    assert install_config_mock.local_os.value == SupportedOS.UBUNTU.value


@pytest.mark.parametrize(
    ("etc_os_release_fake_behavior", "fail_expected"),
    [
        (b'PRETTY_NAME="Ubuntu 20.04.3 LTS"', False),
        (b'PRETTY_NAME="Ubuntu 22.04.1 LTS"', False),
        (b'PRETTY_NAME="Ubuntu 18.04.3 LTS"', True),
        (b'PRETTY_NAME="Red Hat Enterprise Linux 9.2 (Plow)"', False),
        (b'PRETTY_NAME="Red Hat Enterprise Linux 8.5 (Ootpa)"', True),
        (FileNotFoundError, True),
        (CalledProcessError(cmd=["grep", "^PRETTY", "/etc/os-release"], returncode=5), True),
        (TimeoutExpired(cmd=["grep", "^PRETTY", "/etc/os-release"], timeout=5), True),
    ],
    ids=[
        "accepts_correct_version_ubuntu_20",
        "accepts_correct_version_ubuntu_22",
        "rejects_incorrect_version",
        "accepts_correct_version_rhel_9",
        "rejects_incorrect_version_rhel_8",
        "fails_on_missing_etc_os_release",
        "fails_on_called_process_error",
        "fails_on_timeout",
    ],
)
def test_check_os_version(mocker, etc_os_release_fake_behavior, fail_expected):
    etc_os_release_mock = mocker.patch("checks.os.subprocess.check_output")
    if isinstance(etc_os_release_fake_behavior, bytes):
        etc_os_release_mock.return_value = etc_os_release_fake_behavior
    else:
        etc_os_release_mock.side_effect = etc_os_release_fake_behavior
    install_config_mock = InstallationConfig(interactive_mode=False, install_telemetry_stack=False)
    if fail_expected:
        with pytest.raises(LocalOSCheckWarning):
            check_os_version(install_config_mock)
    else:
        check_os_version(install_config_mock)

    etc_os_release_mock.assert_called_once_with(["grep", "^PRETTY", "/etc/os-release"], timeout=5)


@pytest.mark.parametrize(
    ("etc_os_release_fake_behavior", "local_os"),
    [
        (b'PRETTY_NAME="Ubuntu 20.04.3 LTS"', "Ubuntu"),
        (b'PRETTY_NAME="Ubuntu 22.04.1 LTS"', "Ubuntu"),
        (b'PRETTY_NAME="Red Hat Enterprise Linux 9.2 (Plow)"', "Red Hat"),
    ],
    ids=[
        "correct_version_ubuntu_20",
        "correct_version_ubuntu_22",
        "correct_version_rhel_9",
    ],
)
def test_check_local_os(mocker, etc_os_release_fake_behavior, local_os):
    install_config_mock = InstallationConfig(interactive_mode=False, install_telemetry_stack=False)
    etc_os_release_mock = mocker.patch("checks.os.subprocess.check_output")
    etc_os_release_mock.return_value = etc_os_release_fake_behavior
    check_os_version(install_config_mock)
    assert install_config_mock.local_os.value == local_os
