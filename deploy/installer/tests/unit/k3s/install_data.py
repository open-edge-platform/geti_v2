# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

from ifaddr._shared import IP, Adapter

get_first_nonlocal_host_ip_test_data = [
    (
        [
            Adapter(
                name="lo",
                nice_name="lo",
                ips=[
                    IP(ip="127.0.0.1", network_prefix=8, nice_name="lo"),
                    IP(ip=("::1", 0, 0), network_prefix=128, nice_name="lo"),
                ],
                index=1,
            ),
            Adapter(
                name="enp0s3",
                nice_name="enp0s3",
                ips=[
                    IP(ip="10.0.2.15", network_prefix=24, nice_name="enp0s3"),
                    IP(ip=("fe80::a00:27ff:fefc:9437", 0, 2), network_prefix=64, nice_name="enp0s3"),
                ],
                index=2,
            ),
            Adapter(
                name="docker0",
                nice_name="docker0",
                ips=[IP(ip="172.17.0.1", network_prefix=16, nice_name="docker0")],
                index=3,
            ),
        ],
        "10.0.2.15",
    ),
    (
        [
            Adapter(
                name="lo",
                nice_name="lo",
                ips=[
                    IP(ip="127.0.0.1", network_prefix=8, nice_name="lo"),
                    IP(ip=("::1", 0, 0), network_prefix=128, nice_name="lo"),
                ],
                index=1,
            ),
            Adapter(
                name="enp0s3",
                nice_name="enp0s3",
                ips=[IP(ip="127.0.0.1", network_prefix=24, nice_name="eth0")],
                index=2,
            ),
            Adapter(
                name="docker0",
                nice_name="docker0",
                ips=[IP(ip="172.17.0.1", network_prefix=16, nice_name="docker0")],
                index=3,
            ),
        ],
        "172.17.0.1",
    ),
    (
        [
            Adapter(
                name="lo",
                nice_name="lo",
                ips=[
                    IP(ip="127.0.0.1", network_prefix=8, nice_name="lo"),
                    IP(ip=("::1", 0, 0), network_prefix=128, nice_name="lo"),
                ],
                index=1,
            ),
            Adapter(
                name="enp0s3",
                nice_name="enp0s3",
                ips=[IP(ip="127.0.0.1", network_prefix=24, nice_name="eth0")],
                index=2,
            ),
        ],
        None,
    ),
    (
        [
            Adapter(
                name="enp0s3",
                nice_name="enp0s3",
                ips=[IP(ip=("fe80::a00:27ff:fefc:9437", 0, 2), network_prefix=64, nice_name="enp0s3")],
                index=1,
            ),
            Adapter(
                name="docker0",
                nice_name="docker0",
                ips=[IP(ip=("fe80::a00:27ff:fefc:9438", 0, 2), network_prefix=64, nice_name="docker0")],
                index=2,
            ),
            Adapter(name="lo", nice_name="lo", ips=[IP(ip=("::1", 0, 0), network_prefix=128, nice_name="lo")], index=3),
        ],
        None,
    ),
    (
        [
            Adapter(
                name="lo",
                nice_name="lo",
                ips=[
                    IP(ip="127.0.0.1", network_prefix=8, nice_name="lo"),
                    IP(ip=("::1", 0, 0), network_prefix=128, nice_name="lo"),
                ],
                index=1,
            ),
            Adapter(
                name="enp0s3",
                nice_name="enp0s3",
                ips=[
                    IP(ip="192.168.1.55", network_prefix=24, nice_name="enp0s3"),
                    IP(ip="20.237.74.91", network_prefix=24, nice_name="enp0s3"),
                ],
                index=2,
            ),
        ],
        "20.237.74.91",
    ),
    ([], None),
    (
        [
            Adapter(
                name="lo",
                nice_name="lo",
                ips=[
                    IP(ip="127.0.0.1", network_prefix=8, nice_name="lo"),
                    IP(ip=("::1", 0, 0), network_prefix=128, nice_name="lo"),
                ],
                index=1,
            ),
            Adapter(
                name="eth0",
                nice_name="eth0",
                ips=[
                    IP(ip="192.168.1.55", network_prefix=24, nice_name="eth0"),
                    IP(ip="20.237.74.91", network_prefix=24, nice_name="eth0"),
                ],
                index=2,
            ),
            Adapter(
                name="enp0s3",
                nice_name="enp0s3",
                ips=[
                    IP(ip="10.0.2.15", network_prefix=24, nice_name="enp0s3"),
                    IP(ip="3.70.205.252", network_prefix=24, nice_name="enp0s3"),
                ],
                index=3,
            ),
        ],
        "20.237.74.91",
    ),
]


kubeconfig_template = """apiVersion: v1
clusters:
- cluster:
    certificate-authority-data: LS0tTTE5yYVhWTDRFLS0tLS0K
    server: https://{server_address}:6443
  name: default
contexts:
- context:
    cluster: default
    user: default
  name: default
current-context: default
kind: Config
preferences: {{}}
users:
- name: default
  user:
    client-certificate-data: some-data
    client-key-data: another-data

"""
