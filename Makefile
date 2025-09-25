# Copyright (C) 2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

.PHONY: build list-image list-umbrella-chart clean push static-code-analysis tests test-unit test-integration test-component
.DEFAULT_GOAL := build
PROJECTS = interactive_ai platform web_ui web_ui/dex_templates
DISTRIB_CHARTS := deploy/charts interactive_ai/migration_job

build-image:
	echo "Building images for all projects..."
	@for dir in $(PROJECTS); do \
		echo "Running make build-image in $$dir..."; \
		$(MAKE) -C $$dir build-image; \
	done

build-chart:
	echo "Building charts for all projects..."
	@for dir in $(PROJECTS); do \
		echo "Running make build-chart in $$dir..."; \
		$(MAKE) -C $$dir build-chart; \
	done

build-umbrella-chart: build-chart
	@for dir in $(DISTRIB_CHARTS); do \
		echo "Building umbrella charts in $$dir..."; \
		$(MAKE) -C $$dir clean build-chart; \
	done

clean:
	echo "Cleaning all projects..."	
	@for dir in $(PROJECTS) $(DISTRIB_CHARTS); do \
		echo "Running make clean in $$dir..."; \
		$(MAKE) -C $$dir clean; \
	done

list-image:
	@for dir in $(PROJECTS); do \
		$(MAKE) -C $$dir list-image; \
	done

list-umbrella-chart:
	$(MAKE) -C $(DISTRIB_CHARTS) list-umbrella-chart

publish-image:
	echo "Pushing all projects..."
	@for dir in $(PROJECTS); do \
		echo "Running make publish-image in $$dir..."; \
		$(MAKE) -C $$dir publish-image; \
	done

publish-umbrella-chart: build-umbrella-chart
	@for dir in $(DISTRIB_CHARTS); do \
		echo "Publishing umbrella charts in $$dir..."; \
		$(MAKE) -C $$dir publish-chart; \
	done

static-code-analysis:
	echo "Running static code analysis for all projects..."
	@for dir in $(PROJECTS); do \
		echo "Running make static-code-analysis in $$dir..."; \
		$(MAKE) -C $$dir static-code-analysis; \
	done

tests:
	echo "Running tests for all projects..."
	@for dir in $(PROJECTS); do \
		echo "Running make tests in $$dir..."; \
		$(MAKE) -C $$dir tests; \
	done

test-unit:
	echo "Running unit tests for all projects..."
	@for dir in $(PROJECTS); do \
		echo "Running make test-unit in $$dir..."; \
		$(MAKE) -C $$dir test-unit; \
	done

test-integration:
	echo "Running integration tests for all projects..."
	@for dir in $(PROJECTS); do \
		echo "Running make test-integration in $$dir..."; \
		$(MAKE) -C $$dir test-integration; \
	done	

test-component:
	echo "Running component tests for all projects..."
	@for dir in $(PROJECTS); do \
		echo "Running make test-component in $$dir..."; \
		$(MAKE) -C $$dir test-component; \
	done
