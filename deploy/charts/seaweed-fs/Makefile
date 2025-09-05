include ../../../Makefile.shared

COMPONENT_NAME := seaweed-fs

prepare-weights-uploader:
	@echo "Preparing weights-uploader"
	# this folder is created in all the other cases by build-chart-default
	# we have to do it here to able to copy the weights-uploader charts before running build-chart
	mkdir -p ${CHART_TARGET_DIR}/templates
	cp -r ../../../platform/services/weights_uploader/.build/chart/templates/* ${CHART_TARGET_DIR}/templates/

build-chart-default: prepare-weights-uploader
