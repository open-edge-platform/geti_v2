include ../../Makefile.shared-workflows

build-image:
	@echo "Nothing to do - ${COMPONENT_NAME} does not have an image to build"

publish-image:
	@echo "Nothing to do - ${COMPONENT_NAME} does not have an image to push"

test-component: venv
	@echo "test-component not available"

venv: pre-venv
	uv lock --check
	uv sync --frozen ${PIP_INSTALL_PARAMS}
