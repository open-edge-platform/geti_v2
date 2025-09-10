# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
import argparse
import logging
import subprocess
import sys

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


def _get_pod_name(kubeconfig: str) -> str:
    pod_name_cmd = [
        "kubectl",
        "--kubeconfig",
        kubeconfig,
        "-n",
        "impt",
        "get",
        "pods",
        "--selector",
        "app.kubernetes.io/name=user-directory",
        "--output",
        "jsonpath={.items[0].metadata.name}",
    ]
    try:
        logger.debug(f"Running command: {' '.join(pod_name_cmd)}")
        pod_name = subprocess.run(pod_name_cmd, capture_output=True, text=True, check=True)  # noqa: S603
        return pod_name.stdout.strip()
    except subprocess.CalledProcessError as e:
        logger.exception(f"Error: {e.stderr}")
        sys.exit(e.returncode)


def _change_password(username: str, password: str, kubeconfig: str, pod_name: str) -> None:
    kubectl_cmd = [
        "kubectl",
        "--kubeconfig",
        kubeconfig,
        "exec",
        "-n",
        "impt",
        pod_name,
        "--",
        "python3.10",
        "change_password.py",
        "--username",
        username,
        "--password",
        password,
    ]
    try:
        logger.debug(f"Running command: {' '.join(kubectl_cmd)}")
        subprocess.run(kubectl_cmd, text=True, check=True, stderr=subprocess.STDOUT)  # noqa: S603

    except subprocess.CalledProcessError as e:
        logger.exception(f"Error: {e.stderr}")
        sys.exit(e.returncode)


def main():  # noqa: ANN201
    """
    Main function to find user-directory pod and use python script to change user password in LDAP.
    """
    parser = argparse.ArgumentParser(description="A script for changing user password in LDAP.")
    parser.add_argument("--password", type=str, required=True, help="New password for user.")
    parser.add_argument(
        "--username", type=str, required=True, help="Email of the user, which password will be changed."
    )
    parser.add_argument("--kubeconfig", type=str, help="Path to kubeconfig file.", default="/etc/rancher/k3s/k3s.yaml")
    args = parser.parse_args()

    _change_password(
        username=args.username,
        password=args.password,
        kubeconfig=args.kubeconfig,
        pod_name=_get_pod_name(args.kubeconfig),
    )


if __name__ == "__main__":
    main()
