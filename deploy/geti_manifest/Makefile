# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

include ../../Makefile.shared-python

ORAS := /usr/local/bin/oras
ORAS_VERSION := 1.2.3
ORAS_DIR := oras-install

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

push-manifest: prepare-manifest
	$(ORAS_BINARY) push $(REGISTRY)/geti/charts/geti-manifest:$(TAG) \
		--artifact-type=application/text \
		geti-manifest.yaml

prepare-manifest: get-oras
	VERSION=$(TAG) \
	REGISTRY=$(REGISTRY) \
	envsubst < geti-manifest.yaml.template > geti-manifest.yaml

publish-chart: push-manifest

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

build-chart:
	@echo "Not applicable"
