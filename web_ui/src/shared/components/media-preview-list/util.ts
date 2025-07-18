// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

export interface FileItem {
    id: string;
    file: File;
    dataUrl?: string | null | undefined;
    labelIds: string[];
}
