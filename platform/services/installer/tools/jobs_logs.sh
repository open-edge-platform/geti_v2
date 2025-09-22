#!/usr/bin/env bash

# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

# flyte related constants
FLYTE_SECRET_NAME="flyte-k8s-yaml"
FLYTE_NAMESPACE="flyte"
TEMP_K8S_YAML=$(mktemp -u /tmp/flyte-k8s-yaml.XXXXXX)

# jobs related constants
JOBS_NAMESPACE="impt-jobs-production"

# k3s related constants
K3S_CONFIG="/etc/rancher/k3s/k3s.yaml"

if [[ "${1}" == "enable" ]]; then
  delete_flyte_pods="false"
elif [[ "${1}" == "disable" ]]; then
  delete_flyte_pods="true"
else
  echo "Usage: $0 <enable|disable> [kubeconfig]"
  echo "  enable  - make flyte pods deleted (delete-resource-on-finalize: false)"
  echo "  disable - make flyte pods visible (delete-resource-on-finalize: true)"
  exit 1
fi

# use kubeconfig from argument if provided
# otherwise from KUBECONFIG environment variable
# or fallback to /etc/rancher/k3s/k3s.yaml
kubeconfig="${2:-${KUBECONFIG:-"${K3S_CONFIG}"}}"
if [[ ! -f "${kubeconfig}" ]]; then
  echo "Kubeconfig file not found: ${kubeconfig}"
  exit 1
fi

echo "Secret '${FLYTE_SECRET_NAME}' will be updated to set delete-resource-on-finalize: ${delete_flyte_pods}"
kubectl --kubeconfig="${kubeconfig}" get secret "${FLYTE_SECRET_NAME}" -n "${FLYTE_NAMESPACE}" -o jsonpath="{.data.k8s\.yaml}" | base64 --decode > "${TEMP_K8S_YAML}"
sed -i "s/[[:space:]]*delete-resource-on-finalize: \(true\|false\)/    delete-resource-on-finalize: ${delete_flyte_pods}/g" "${TEMP_K8S_YAML}"
ENCODED_DATA=$(base64 -w 0 "${TEMP_K8S_YAML}")
kubectl --kubeconfig="${kubeconfig}" patch secret "${FLYTE_SECRET_NAME}" -n "${FLYTE_NAMESPACE}" --type='merge' -p "{\"data\":{\"k8s.yaml\":\"${ENCODED_DATA}\"}}"

# delete all pods in JOBS_NAMESPACE
if [[ "${delete_flyte_pods}" == "true" ]]; then
  echo ""
  echo "Deleting all pods in namespace ${JOBS_NAMESPACE}"
  kubectl --kubeconfig="${kubeconfig}" delete pods --all -n "${JOBS_NAMESPACE}"
fi

# cleanup
rm -f "${TEMP_K8S_YAML}"
