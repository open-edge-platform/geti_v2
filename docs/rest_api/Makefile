include ../../Makefile.shared

RESTAPI_BUILD_DIR                  := ${TARGET_DIR}/rest-api

.PHONY: build

# Replaces all ${TAG} placeholders with the current build version
build:
	@echo "Building REST API..."
	@mkdir -p $(RESTAPI_BUILD_DIR)

	@echo "Copying source files..."
	@rsync -av --exclude='Makefile' --exclude='.build' . $(RESTAPI_BUILD_DIR)

	@echo "Processing OpenAPI specifications..."
	@for file in openapi.yaml openapi_internal.yaml; do \
		echo "Processing $$file..."; \
		TAG=$(TAG) envsubst '$$TAG' < $(RESTAPI_BUILD_DIR)/$$file > $(RESTAPI_BUILD_DIR)/$$file.tmp; \
		mv $(RESTAPI_BUILD_DIR)/$$file.tmp $(RESTAPI_BUILD_DIR)/$$file; \
	done

	@echo "Build complete"
