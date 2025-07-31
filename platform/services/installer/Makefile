# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
include ../../../Makefile.shared-python

.PHONY: build_installer_dev

COMPONENT_NAME = installer

DOCKER_BUILD_CONTEXT := --build-context libs=../../../libs

build_installer_binary: build-image
	$(eval CONTAINER_ID := $(shell docker run -d --rm $(REGISTRY)/geti/${COMPONENT_NAME}:${TAG} sleep 10))
	@sleep 2
	docker cp $(CONTAINER_ID):/app/dist/platform_installer .

build-chart-default:
	@echo "Not applicable"

build-image-default:
	@echo "Not applicable"

test-component:
	@echo "Not applicable"

test-integration:
	@echo "Not applicable"

test-unit:
	@echo "Not applicable"

publish-image:
	@echo "Not applicable"

publish-chart:
	@echo "Not applicable"

lint-chart:
	@echo "Not applicable"
