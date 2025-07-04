# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import os

PLATFORM_VERSION = os.getenv("PLATFORM_VERSION")
SERVICE_NAME = "install-upgrade"
NAMESPACE = "default"
DATA_FOLDER_PATH = os.getenv("DATA_FOLDER")
GETI_REGISTRY = os.getenv("GETI_REGISTRY")
MAX_RETRIES = 5
RETRY_INTERVAL = 5
INSTALL_VERSION = os.getenv("INSTALL_VERSION")

CRITICAL_SECRETS = ["impt-mongodb", "impt-postgresql", "impt-spice-db", "impt-ldap-service-user", "impt-seaweed-fs"]
