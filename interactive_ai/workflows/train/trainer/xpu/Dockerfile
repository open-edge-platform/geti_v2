# Required runtime flags to enable XPU support:
# --device /dev/dri          # Intel GPU access
# -v /dev/dri/by-path:/dev/dri/by-path  # Device path mapping

FROM python:3.10-slim-bookworm@sha256:81f1cdb3770d54ecfdbddcc52c2125fce674c14a1d976dfd8f65dc0734f9c3c5 AS base

ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy
ENV UV_PYTHON_DOWNLOADS=0

# Step 1: Install runtime dependencies and intel graphics libs
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    libgl1=1.6.* \
    libglib2.0-0=2.74.* \
    software-properties-common \
    gpg \
    wget \
    curl && \
    rm -rf /var/lib/apt/lists/* && \
    useradd -l -u 10001 non-root && \
    pip3 uninstall -y setuptools pip wheel && \
    rm -rf /root/.cache/pip

RUN wget -qO /tmp/intel-graphics.key https://repositories.intel.com/gpu/intel-graphics.key && \
    gpg --yes --dearmor --output /usr/share/keyrings/intel-graphics.gpg /tmp/intel-graphics.key
RUN echo "deb [arch=amd64,i386 signed-by=/usr/share/keyrings/intel-graphics.gpg] https://repositories.intel.com/gpu/ubuntu jammy unified" | tee /etc/apt/sources.list.d/intel-gpu-jammy.list
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    git libze-intel-gpu1 libze1 intel-opencl-icd clinfo libze-dev intel-ocloc
# Remove unnecessary packages and files to reduce the final image size
RUN apt-get purge -y --auto-remove gpg wget && \
    rm -rf /root/.cache \
    /var/cache/apt/* /var/lib/apt/lists/* /var/log/* \
    /tmp/* \
    /usr/share/man/* /usr/share/doc/*

# Copy the service dependencies
COPY --link --from=libs . libs

WORKDIR /interactive_ai/workflows/train/trainer
RUN chown -R 10001:10001 /interactive_ai/workflows/train/trainer

COPY --link --from=ghcr.io/astral-sh/uv:0.6.12@sha256:515b886e8eb99bcf9278776d8ea41eb4553a794195ef5803aa7ca6258653100d /uv /bin/uv

COPY --link scripts/ scripts
COPY --link run run
COPY --link uv.lock uv.lock
COPY --link pyproject.toml pyproject.toml
COPY --link download_pretrained_weights.py download_pretrained_weights.py

# For OTX to install torch with ipex support, else defaults to cpu version
RUN --mount=type=cache,target=/root/.cache/uv uv sync --frozen --no-dev --no-editable
RUN uv pip uninstall torch torchvision
RUN uv pip install torch==2.7.0 torchvision==0.22.0 --default-index https://download.pytorch.org/whl/xpu

# Place executables in the environment at the front of the path
ENV PATH="/interactive_ai/workflows/train/trainer/.venv/bin:/interactive_ai/workflows/train/trainer:$PATH"
ENV PYTHONPATH="/interactive_ai/workflows/train/trainer"
ENV HF_HUB_OFFLINE=1

USER non-root

WORKDIR /home/non-root
WORKDIR /interactive_ai/workflows/train/trainer
