FROM python:3.10.18-bullseye@sha256:65c6bdcca22db1a3468a0262ae05f38a0a718f51e9818cd09c12094aaae28a33 AS builder

ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy

# Disable Python downloads, because we want to use the system interpreter
# across both images.
ENV UV_PYTHON_DOWNLOADS=0

WORKDIR /deploy/services/installer

COPY --link --from=ghcr.io/astral-sh/uv:0.6.12@sha256:515b886e8eb99bcf9278776d8ea41eb4553a794195ef5803aa7ca6258653100d /uv /bin/uv
COPY --link --from=libs . /libs

RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --frozen --no-dev --no-editable

COPY --link ./app ./app

RUN . .venv/bin/activate && \
    pyinstaller \
    --exclude-module readline \
    --add-data "app/templates:templates" \
    --add-data "app/version.yaml:." \
    --add-data "app/system-packages.yaml:." \
     -F app/platform_installer.py

# this step is needed in order to see binary after build
FROM scratch AS exporter
COPY --from=builder /deploy/services/installer/dist/platform_installer /
