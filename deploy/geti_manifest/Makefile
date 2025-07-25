# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

include ../../Makefile.shared

ORAS := /usr/local/bin/oras
ORAS_VERSION := 1.2.3
ORAS_DIR := oras-install
INTEL_DEVICE_PLUGIN_VERSION := 0.32.0

ifneq (,$(wildcard $(ORAS)))
    ORAS_BINARY := $(ORAS)
else
    ORAS_BINARY := ./$(ORAS_DIR)/oras
endif

get-oras: $(ORAS)
$(ORAS):
	curl -LO "https://github.com/oras-project/oras/releases/download/v$(ORAS_VERSION)/oras_$(ORAS_VERSION)_linux_amd64.tar.gz"
	mkdir -p $(ORAS_DIR)/
	tar -zxf oras_$(ORAS_VERSION)_*.tar.gz -C $(ORAS_DIR)/
	rm -rf oras_$(ORAS_VERSION)_*.tar.gz

remove-oras:
	rm -rf $(ORAS_DIR)

publish-chart: build-chart
	$(ORAS_BINARY) push $(REGISTRY)/geti/charts/geti-manifest:$(TAG) \
		--artifact-type=application/text \
		geti-manifest.yaml.j2
	$(ORAS_BINARY) push $(REGISTRY)/geti/charts/intel-device-plugin:$(INTEL_DEVICE_PLUGIN_VERSION) \
		--artifact-type=application/text \
		intel-device-plugin.yaml

build-chart: get-oras
	VERSION=$(VERSION) \
	REGISTRY=$(MANIFEST_REGISTRY) \
	TAG=$(TAG) \
	INTEL_DEVICE_PLUGIN_VERSION=$(INTEL_DEVICE_PLUGIN_VERSION) \
	envsubst < geti-manifest.yaml.j2 > geti-manifest.yaml.j2.tmp && mv geti-manifest.yaml.j2.tmp geti-manifest.yaml.j2

static-code-analysis:
	@echo "Not applicable"

test-unit:
	@echo "Not applicable"

test-component:
	@echo "Not applicable"

test-integration:
	@echo "Not applicable"

build-image:
	@echo "Not applicable"

publish-image:
	@echo "Not applicable"

lint-chart:
	@echo "Not applicable"
