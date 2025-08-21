FROM python:3.10.18-bullseye

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
