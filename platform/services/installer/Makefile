include ../../../Makefile.shared-python

COMPONENT_NAME := platform-installer
IMAGE_TAG ?= "$(COMPONENT_NAME):$(TAG)"

DOCKER_BUILD_CONTEXT := --build-context libs=../../../libs
publish-chart:
	@echo "Not applicable"

test-component:
	@echo "Not applicable"

test-integration:
	@echo "Not applicable"

build: build-image

build-image:
	@echo "Building docker image for installer"
	@mkdir -p platform_$(TAG)
	TAG=$(TAG) PRODUCT_VERSION=$(PRODUCT_VERSION) envsubst < app/version.yaml.template > app/version.yaml
	@docker build \
		${DOCKER_EXTRA_ARGS} \
		${DOCKER_BUILD_CONTEXT} \
		-t $(IMAGE_TAG) \
		-f Dockerfile . \
		--output type=local,dest=platform_$(TAG) \
		--target exporter

clean:
	@rm -rf __pycache__ .cache .pytest_cache .venv .mypy_cache platform_*

list-image:
	@echo "Not applicable"

lint-chart:
	@echo "Not applicable"

publish-image:
	@echo "Not applicable"

publish-chart:
	@echo "Not applicable"
