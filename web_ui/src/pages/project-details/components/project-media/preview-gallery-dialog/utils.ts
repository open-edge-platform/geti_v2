// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

export interface PreviewFile {
    id: string;
    file: File;
    labelIds: string[];
}

export enum SortingOptions {
    LABEL_NAME_A_Z = 'labelNameAtoZ',
    LABEL_NAME_Z_A = 'labelNameZtoA',
}
