# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import subprocess

from k3s.detect_selinux import is_selinux_installed


def test_selinux_not_installed(mocker):
    mocker.patch("k3s.detect_selinux._get_local_os", return_value="Red Hat Enterprise Linux 9")
    mocker.patch(
        "k3s.detect_selinux.subprocess_run",
        side_effect=subprocess.CalledProcessError(returncode=127, cmd=["fake command"]),
    )
    check_selinux = is_selinux_installed()

    assert check_selinux is False


def test_selinux_installed_rhel(mocker):
    mocker.patch("k3s.detect_selinux._get_local_os", return_value="Red Hat Enterprise Linux 9")
    mocker.patch("k3s.detect_selinux.subprocess_run")
    check_selinux = is_selinux_installed()

    assert check_selinux is True


def test_selinux_ubuntu(mocker):
    mocker.patch("k3s.detect_selinux._get_local_os", return_value="Ubuntu 24.04")
    check_selinux = is_selinux_installed()

    assert check_selinux is False
