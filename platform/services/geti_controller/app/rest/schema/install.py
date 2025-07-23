# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

from pydantic import BaseModel


class InstallRequest(BaseModel):
    version_number: str
    gpu_label: str | None = None
    render_gid: int | None = None


class InstallResponse(BaseModel):
    detail: str
