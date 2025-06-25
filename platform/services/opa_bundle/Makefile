# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

include ../../../Makefile.shared

COMPONENT_NAME=opa-bundle

OPA_BUILDER_IMAGE := openpolicyagent/opa:0.66.0
BUNDLE_BUILD_DIR  := ${TARGET_DIR}/bundle
EXTRA_CHART_SRC_DIR  := ${BUNDLE_BUILD_DIR}/all.tar.gz

prepare-policies:
	@echo "Preparing OPA policies"
	mkdir -p ${BUNDLE_BUILD_DIR}/policies/all
	cp app/policies/common/mask_sensitive_logs.rego ${BUNDLE_BUILD_DIR}/policies/all/mask_sensitive_logs.rego
	cp app/policies/common/common.rego ${BUNDLE_BUILD_DIR}/policies/all/policy.rego
	find app/policies/ -name all -prune -o -name "policy.rego" -print | xargs cat >> ${BUNDLE_BUILD_DIR}/policies/all/policy.rego
	@for dir in acc credits default gtw; do \
		mkdir -p "${BUNDLE_BUILD_DIR}/policies/test/$$dir" || exit 1; \
		cp "${BUNDLE_BUILD_DIR}/policies/all/policy.rego" "${BUNDLE_BUILD_DIR}/policies/test/$$dir/" || exit 1; \
		cp "app/policies/$$dir/policy_test.rego" "${BUNDLE_BUILD_DIR}/policies/test/$$dir/" || exit 1; \
	done
	@echo "Policies preparation complete."

build-bundle: prepare-policies
	@echo "Preparing OPA policy bundle"
	docker run --rm \
		-u $(shell id -u):$(shell id -g) \
		-v $$(pwd):/workspace \
		-w /workspace \
		${OPA_BUILDER_IMAGE} \
		build \
		-b ${BUNDLE_BUILD_DIR}/policies/all/ \
		-o ${BUNDLE_BUILD_DIR}/all.tar.gz \
		-O=1 \
		--entrypoint istio/authz
	@echo "OPA policy bundle created: ${BUNDLE_BUILD_DIR}/all.tar.gz"

test-unit-default: prepare-policies
	@for dir in acc credits default gtw; do \
  		echo "Running unit tests for $$dir..."; \
		docker run --rm \
			-v $$(pwd):/workspace \
			-w /workspace \
			${OPA_BUILDER_IMAGE} \
			test ${BUNDLE_BUILD_DIR}/policies/test/$$dir/ -v; \
	done

static-code-analysis-default: prepare-policies
	@echo "Checking Rego source files for parse and compilation errors"
	@docker run --rm \
		-v $$(pwd):/workspace \
		-w /workspace \
		${OPA_BUILDER_IMAGE} \
		check -b ${BUNDLE_BUILD_DIR}/policies/all
	@echo "Checking Rego source files for parse and compilation errors completed"

build-chart-default: build-bundle

test-component:
	@echo "Not applicable"

test-integration:
	@echo "Not applicable"

build-image:
	@echo "Not applicable"

publish-image:
	@echo "Not applicable"

publish-chart:
	@echo "Not applicable"
