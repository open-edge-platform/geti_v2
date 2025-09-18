#!/usr/bin/env bash

# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

removal_flyte_pods="${1}"
if [[ "${removal_flyte_pods}" == "enable" ]]; then
  delete_flyte_pods="true"
elif [[ "${removal_flyte_pods}" == "disable" ]]; then
  delete_flyte_pods="false"
else
  echo "Usage: $0 <enable|disable> [kubeconfig]"
  echo "  enable  - make flyte pods deleted (delete-resource-on-finalize: true)"
  echo "  disable - make flyte pods visible (delete-resource-on-finalize: false)"
  exit 1
fi

# use kubeconfig from argument if provided
# otherwise from KUBECONFIG environment variable
# or fallback to /etc/rancher/k3s/k3s.yaml
kubeconfig="${2:-${KUBECONFIG:-/etc/rancher/k3s/k3s.yaml}}"
if [[ ! -f "${kubeconfig}" ]]; then
  echo "Kubeconfig file not found: ${kubeconfig}"
  exit 1
fi

# flyte related variables
FLYTE_SECRET_NAME="flyte-k8s-yaml"
FLYTE_NAMESPACE="flyte"
TEMP_K8S_YAML=$(mktemp -u /tmp/flyte-k8s-yaml.XXXXXX)
FLYTE_PROPELLER_DEPLOYMENT="flytepropeller"

# jobs related variables
JOBS_NAMESPACE="impt-jobs-production"

echo "Secret '${FLYTE_SECRET_NAME}' will be updated to set delete-resource-on-finalize: ${delete_flyte_pods}"
kubectl --kubeconfig="${kubeconfig}" get secret "${FLYTE_SECRET_NAME}" -n "${FLYTE_NAMESPACE}" -o jsonpath="{.data.k8s\.yaml}" | base64 --decode > "${TEMP_K8S_YAML}"
sed -i "s/[[:space:]]*delete-resource-on-finalize: \(true\|false\)/    delete-resource-on-finalize: ${delete_flyte_pods}/g" "${TEMP_K8S_YAML}"
ENCODED_DATA=$(cat ${TEMP_K8S_YAML} | base64 -w 0)
kubectl --kubeconfig="${kubeconfig}" patch secret "${FLYTE_SECRET_NAME}" -n "${FLYTE_NAMESPACE}" --type='merge' -p "{\"data\":{\"k8s.yaml\":\"${ENCODED_DATA}\"}}"
echo ""

echo "Restarting '${FLYTE_PROPELLER_DEPLOYMENT}' to pick up the changes..."
kubectl --kubeconfig="${kubeconfig}" rollout restart deployment "${FLYTE_PROPELLER_DEPLOYMENT}" -n "${FLYTE_NAMESPACE}"

# delete all pods in JOBS_NAMESPACE
if [[ "${delete_flyte_pods}" == "true" ]]; then
  echo ""
  echo "Deleting all pods in namespace ${JOBS_NAMESPACE}"
  kubectl --kubeconfig="${kubeconfig}" delete pods --all -n "${JOBS_NAMESPACE}"
fi

# cleanup
rm -rf "${TEMP_K8S_YAML}"
