FROM python:3.10-slim-bookworm@sha256:9dd6774a1276178f94b0cc1fb1f0edd980825d0ea7634847af9940b1b6273c13 AS base

FROM base AS build

# Install Git and clone the OTX at the specified tag
ARG OTX_RELEASE_TAG=2.4.6

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    git

RUN git clone --branch $OTX_RELEASE_TAG --single-branch https://github.com/open-edge-platform/training_extensions.git

ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy

# Disable Python downloads, because we want to use the system interpreter across both images.
ENV UV_PYTHON_DOWNLOADS=0

# Copy the service dependencies
COPY --link --from=libs . libs
COPY --link --from=iai_core . interactive_ai/libs/iai_core_py

WORKDIR /interactive_ai/services/auto_train

COPY --link --from=ghcr.io/astral-sh/uv:0.6.12@sha256:515b886e8eb99bcf9278776d8ea41eb4553a794195ef5803aa7ca6258653100d /uv /bin/uv

COPY --link app/ .

RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --frozen --no-dev --no-editable

FROM base AS runtime

RUN useradd -l -u 10001 non-root && \
	pip3 uninstall -y setuptools pip wheel && \
    rm -rf /root/.cache/pip

# Copy the application from the builder
COPY --link --from=build --chown=10001 /interactive_ai/services/auto_train /interactive_ai/services/auto_train
COPY --link --from=build --chown=10001 /training_extensions/src/otx/tools/templates /model_templates

# Update anomaly classification templates to anomaly, needed for anomaly reduction process
RUN cp -r /model_templates/anomaly/classification/* /model_templates/anomaly/ && \
    rm -rf /model_templates/anomaly/classification && \
    rm -rf /model_templates/anomaly/detection && \
    rm -rf /model_templates/anomaly/segmentation && \
    find /model_templates/anomaly -type f -name "template.yaml" -exec sed -i 's/model_template_id: ote_anomaly_classification_\([^/]*\)/model_template_id: ote_anomaly_\1/g' {} + && \
    find /model_templates/anomaly -type f -name "template.yaml" -exec sed -i 's/task_type: ANOMALY_CLASSIFICATION/task_type: ANOMALY/g' {} +

# Place executables in the environment at the front of the path
ENV PATH="/interactive_ai/services/auto_train/.venv/bin:$PATH"
ENV PYTHONPATH="/interactive_ai/services/auto_train"

USER non-root
WORKDIR /interactive_ai/services/auto_train
CMD ["python", "main.py"]
