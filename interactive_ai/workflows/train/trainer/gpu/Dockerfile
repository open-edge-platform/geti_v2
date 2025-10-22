FROM python:3.10-slim-bookworm@sha256:cda0e2fa3894f9ada2c652534e6de6b2fe65687c63208a77e9e8d88231547902 AS base

# step 1: get cuda dependencies
FROM base AS cuda
ENV TORCH_EXTENSIONS_DIR=/.torch
ENV LIBRARY_PATH=/usr/local/cuda/lib64/stubs
ENV NCCL_VERSION=2.26.5
ENV CUDA_VERSION=12.9.1
ENV NV_CUDNN_VERSION=9.13.0
ENV NVIDIA_REQUIRE_CUDA=cuda>=12.1 brand=tesla,driver>=470,driver<471 brand=unknown,driver>=470,driver<471 brand=nvidia,driver>=470,driver<471 brand=nvidiartx,driver>=470,driver<471 brand=geforce,driver>=470,driver<471 brand=geforcertx,driver>=470,driver<471 brand=quadro,driver>=470,driver<471 brand=quadrortx,driver>=470,driver<471 brand=titan,driver>=470,driver<471 brand=titanrtx,driver>=470,driver<471 brand=tesla,driver>=525,driver<526 brand=unknown,driver>=525,driver<526 brand=nvidia,driver>=525,driver<526 brand=nvidiartx,driver>=525,driver<526 brand=geforce,driver>=525,driver<526 brand=geforcertx,driver>=525,driver<526 brand=quadro,driver>=525,driver<526 brand=quadrortx,driver>=525,driver<526 brand=titan,driver>=525,driver<526 brand=titanrtx,driver>=525,driver<526
ENV NVIDIA_DRIVER_CAPABILITIES=compute,utility
ENV NVIDIA_VISIBLE_DEVICES=all
ENV LD_LIBRARY_PATH=/usr/local/nvidia/lib:/usr/local/nvidia/lib64:/usr/local/lib
ENV PATH=/usr/local/nvidia/bin:/usr/local/cuda/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
ENV TORCH_CUDA_ARCH_LIST="6.0;6.1;6.2;7.0;7.2;7.5;8.0;8.6"
ENV TORCH_DONT_CHECK_COMPILER_ABI=1

RUN apt update \
    && apt install -y wget --no-install-recommends

RUN wget https://developer.download.nvidia.com/compute/cuda/repos/debian12/x86_64/cuda-keyring_1.1-1_all.deb \
    && dpkg -i cuda-keyring_1.1-1_all.deb \
    && rm -rf cuda-keyring_1.1-1_all.deb

RUN apt update \
    && apt install -y --no-install-recommends \
    cuda-libraries-12-9 \
    cuda-compiler-12-9 \
    && apt clean all \
    && rm -rf /var/cache/apt/* \
    && echo "/usr/local/nvidia/lib" >> /etc/ld.so.conf.d/nvidia.conf \
    && echo "/usr/local/nvidia/lib64" >> /etc/ld.so.conf.d/nvidia.conf

RUN rm -rf /usr/local/cuda-12.9/targets/x86_64-linux/lib/libnvrtc.alt.so.12 \
    /usr/local/cuda-12.9/targets/x86_64-linux/lib/libnvrtc.alt.so.12.9.86 \
    /usr/local/cuda-12.9/targets/x86_64-linux/lib/libnvrtc-builtins.alt.so.12.9 \
    /usr/local/cuda-12.9/targets/x86_64-linux/lib/libcusolverMg.so.11 \
    /usr/local/cuda-12.9/targets/x86_64-linux/lib/libnvrtc-builtins.alt.so.12.9.86 \
    /usr/local/cuda-12.9/targets/x86_64-linux/lib/libcusolverMg.so.11.7.5.82 \
    /usr/local/cuda-12.9/targets/x86_64-linux/lib/libcufilt.a

# step 2: get python dependencies
FROM base AS python_dependencies

RUN ulimit -n 65536

ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy

# Disable Python downloads, because we want to use the system interpreter across both images.
ENV UV_PYTHON_DOWNLOADS=0

# Copy the service dependencies
COPY --link --from=libs . libs

WORKDIR /interactive_ai/workflows/train/trainer
RUN chown -R 10001:10001 /interactive_ai/workflows/train/trainer

COPY --link --from=ghcr.io/astral-sh/uv:0.6.12@sha256:515b886e8eb99bcf9278776d8ea41eb4553a794195ef5803aa7ca6258653100d /uv /bin/uv

COPY --link scripts/ scripts
COPY --link run run
COPY --link download_pretrained_weights.py download_pretrained_weights.py


RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    git

RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --frozen --no-dev --no-editable

# Install runtime dependencies
RUN pip3 uninstall -y setuptools pip wheel && \
    rm -rf /root/.cache/pip

# Place executables in the environment at the front of the path
RUN rm -rf /interactive_ai/workflows/train/trainer/.venv/lib/python3.10/site-packages/nvidia/cublas/include \
    /interactive_ai/workflows/train/trainer/.venv/lib/python3.10/site-packages/nvidia/cuda_cupti/include \
    /interactive_ai/workflows/train/trainer/.venv/lib/python3.10/site-packages/nvidia/cuda_cupti/lib/libcheckpoint.so \
    /interactive_ai/workflows/train/trainer/.venv/lib/python3.10/site-packages/nvidia/cuda_cupti/lib/libnvperf_host.so \
    /interactive_ai/workflows/train/trainer/.venv/lib/python3.10/site-packages/nvidia/cuda_cupti/lib/libnvperf_target.so \
    /interactive_ai/workflows/train/trainer/.venv/lib/python3.10/site-packages/nvidia/cuda_cupti/lib/libpcsamplingutil.so \
    /interactive_ai/workflows/train/trainer/.venv/lib/python3.10/site-packages/nvidia/cuda_nvrtc/libnvrtc.alt.so.12 \
    /interactive_ai/workflows/train/trainer/.venv/lib/python3.10/site-packages/nvidia/cuda_nvrtc/libnvrtc-builtins.alt.so.12.9 \
    /interactive_ai/workflows/train/trainer/.venv/lib/python3.10/site-packages/nvidia/cuda_runtime/include \
    /interactive_ai/workflows/train/trainer/.venv/lib/python3.10/site-packages/nvidia/cufft/include \
    /interactive_ai/workflows/train/trainer/.venv/lib/python3.10/site-packages/nvidia/curand/include \
    /interactive_ai/workflows/train/trainer/.venv/lib/python3.10/site-packages/nvidia/cusolver/include \
    /interactive_ai/workflows/train/trainer/.venv/lib/python3.10/site-packages/nvidia/cusolver/lib/libcusolverMg.so.11 \
    /interactive_ai/workflows/train/trainer/.venv/lib/python3.10/site-packages/nvidia/cusparse/include \
    /interactive_ai/workflows/train/trainer/.venv/lib/python3.10/site-packages/nvidia/nvjitlink/include \
    /interactive_ai/workflows/train/trainer/.venv/lib/python3.10/site-packages/nvidia/cudnn/include \
    /interactive_ai/workflows/train/trainer/.venv/lib/python3.10/site-packages/nvidia/cudnn/lib/__init__.py \
    /interactive_ai/workflows/train/trainer/.venv/lib/python3.10/site-packages/nvidia/cudnn/lib/__pycache__ \
    /interactive_ai/workflows/train/trainer/.venv/lib/python3.10/site-packages/nvidia/cudnn/__pycache__ \
    /interactive_ai/workflows/train/trainer/.venv/lib/python3.10/site-packages/triton/backends/nvidia \
    /interactive_ai/workflows/train/trainer/.venv/lib/python3.10/site-packages/nvidia/cuda_nvrtc/lib/libnvrtc.alt.so.12 \
    /interactive_ai/workflows/train/trainer/.venv/lib/python3.10/site-packages/nvidia/cuda_nvrtc/lib/libnvrtc-builtins.alt.so.12.8

FROM python:3.10-slim-bookworm@sha256:cda0e2fa3894f9ada2c652534e6de6b2fe65687c63208a77e9e8d88231547902 AS runtime

RUN ulimit -n 65536

# Install runtime dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    libgl1=1.6.* \
    libglib2.0-0=2.74.* \
    curl && \
    rm -rf /var/lib/apt/lists/*

RUN useradd -l -u 10001 non-root

USER non-root
WORKDIR /home/non-root

COPY --link --from=cuda --chown=10001 /usr/local /usr/local
COPY --link --from=python_dependencies --chown=10001 /interactive_ai /interactive_ai

WORKDIR /interactive_ai/workflows/train/trainer

COPY --link scripts/ scripts
COPY --link run run
COPY --link download_pretrained_weights.py download_pretrained_weights.py

ENV PATH="/interactive_ai/workflows/train/trainer/.venv/bin:/interactive_ai/workflows/train/trainer:$PATH"
ENV PYTHONPATH="/interactive_ai/workflows/train/trainer"
ENV HF_HUB_OFFLINE=1
