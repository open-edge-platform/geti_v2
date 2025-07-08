// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { getImageMimeType } from './media-upload.validator';

describe('getImageMimeType', () => {
    it('convert multiple extensions to their corresponding mime types', () => {
        const extensions = ['png', 'gif', 'bmp'];
        const result = getImageMimeType(extensions);
        expect(result).toEqual(['image/png', 'image/gif', 'image/bmp']);
    });

    it('remove duplicate mime types', () => {
        const extensions = ['jpg', 'jpeg', 'png', 'jpg'];
        const result = getImageMimeType(extensions);
        expect(result).toEqual(['image/jpeg', 'image/png']);
    });
});
