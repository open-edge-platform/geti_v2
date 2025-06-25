// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { MEDIA_PREPROCESSING_STATUS } from '../base.interface';
import { getDefaultPreprocessingStatus, isMediaPreprocessing } from './preprocessing.utils';

describe('preprocessing.utils', () => {
    describe('Status Check Functions', () => {
        describe('isMediaPreprocessing', () => {
            it.each([
                [MEDIA_PREPROCESSING_STATUS.SCHEDULED, true],
                [MEDIA_PREPROCESSING_STATUS.IN_PROGRESS, true],
                [MEDIA_PREPROCESSING_STATUS.FINISHED, false],
                [MEDIA_PREPROCESSING_STATUS.FAILED, false],
                [undefined, false],
            ])('should return %s when status is %s', (status, expected) => {
                expect(isMediaPreprocessing(status)).toBe(expected);
            });
        });
    });

    describe('Utility Functions', () => {
        describe('getDefaultPreprocessingStatus', () => {
            it('should return FINISHED for undefined status', () => {
                expect(getDefaultPreprocessingStatus(undefined)).toBe(MEDIA_PREPROCESSING_STATUS.FINISHED);
            });

            it.each([
                MEDIA_PREPROCESSING_STATUS.SCHEDULED,
                MEDIA_PREPROCESSING_STATUS.IN_PROGRESS,
                MEDIA_PREPROCESSING_STATUS.FAILED,
                MEDIA_PREPROCESSING_STATUS.FINISHED,
            ])('should return the provided status when defined: %s', (status) => {
                expect(getDefaultPreprocessingStatus(status)).toBe(status);
            });
        });
    });
});
