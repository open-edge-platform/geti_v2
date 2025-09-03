include ../../../Makefile.shared-python

COMPONENT_NAME := platform-installer
IMAGE_TAG ?= "$(COMPONENT_NAME):latest"

DOCKER_BUILD_CONTEXT := --build-context libs=../../../libs

publish-chart:
	@echo "Not applicable"

test-component:
	@echo "Not applicable"

test-integration:
	@echo "Not applicable"

build: build-image build-installer

build-installer:
	$(eval CONTAINER_ID := $(shell docker run -d --rm $(IMAGE_TAG) sleep 10))
	@sleep 2
	@docker cp $(CONTAINER_ID):/deploy/services/installer/dist/platform_installer .

build-image:
	@echo "Building docker image for installer"
	@docker build \
		${DOCKER_EXTRA_ARGS} \
		${DOCKER_BUILD_CONTEXT} \
		-t $(IMAGE_TAG) \
		-f Dockerfile .

clean:
	@rm -rf __pycache__ .cache .pytest_cache .venv .mypy_cache platform_installer platform_logs

list-image:
	@echo "Not applicable"

lint-chart:
	@echo "Not applicable"

publish-image:
	@echo "Not applicable"

publish-chart:
	@echo "Not applicable"
