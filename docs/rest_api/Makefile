include ../../Makefile.shared

RESTAPI_BUILD_DIR                  := ${TARGET_DIR}/rest-api

build:
	mkdir -p ${RESTAPI_BUILD_DIR} && \
	rsync -av --exclude='Makefile' --exclude=".build" . ${RESTAPI_BUILD_DIR} && \
	TAG=$(TAG) envsubst '$$TAG' < ${RESTAPI_BUILD_DIR}/openapi.yaml > ${RESTAPI_BUILD_DIR}/openapi.yaml.tmp && \
	mv ${RESTAPI_BUILD_DIR}/openapi.yaml.tmp ${RESTAPI_BUILD_DIR}/openapi.yaml && \
	TAG=$(TAG) envsubst '$$TAG' < ${RESTAPI_BUILD_DIR}/openapi_internal.yaml > ${RESTAPI_BUILD_DIR}/openapi_internal.yaml.tmp && \
	mv ${RESTAPI_BUILD_DIR}/openapi_internal.yaml.tmp ${RESTAPI_BUILD_DIR}/openapi_internal.yaml

