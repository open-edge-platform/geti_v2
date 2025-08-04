// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { Key } from 'react';

import { Selection } from '@geti/ui';

import { getIds } from '../../../../../shared/utils';
import { mockFile } from '../../../../../test-utils/mockFile';
import {
    getSelectedLabelIds,
    PreviewFile,
    removeMultipleSelections,
    toggleItemSelection,
    toggleMultipleSelection,
    updateLabels,
} from './utils';

const fileA = { id: '1', file: mockFile({}), labelIds: ['label1', 'label2'] };
const fileB = { ...fileA, id: '2', labelIds: ['label3'] };
const fileC = { ...fileA, id: '3', labelIds: [] };

const expectSetToEqual = (result: Selection, assertions: (set: Set<Key>) => void) => {
    if (result instanceof Set) {
        assertions(result);
    } else {
        fail('Expected result to be a Set');
    }
};

describe('getSelectedLabelIds', () => {
    it('labelIds for selected files', () => {
        const currentFiles = [fileA, fileB, fileC];
        const selectedKeys = new Set([fileA.id, fileB.id]);
        expect(getSelectedLabelIds(currentFiles, selectedKeys)).toEqual([...fileA.labelIds, ...fileB.labelIds]);
    });

    it('empty array if no files are selected', () => {
        const currentFiles = [fileA, fileB];
        const selectedKeys = new Set<Key>();
        expect(getSelectedLabelIds(currentFiles, selectedKeys)).toEqual([]);
    });

    it('empty array if selected files have no labelIds', () => {
        const currentFiles = [fileC];
        const selectedKeys = new Set([fileC.id]);
        expect(getSelectedLabelIds(currentFiles, selectedKeys)).toEqual([]);
    });

    it('ignores files not in selectedKeys', () => {
        const currentFiles = [fileA, fileB];
        const selectedKeys = new Set([fileB.id]);
        expect(getSelectedLabelIds(currentFiles, selectedKeys)).toEqual(fileB.labelIds);
    });

    it('empty array if currentFiles is empty', () => {
        const currentFiles: PreviewFile[] = [];
        const selectedKeys = new Set([fileA.id]);
        expect(getSelectedLabelIds(currentFiles, selectedKeys)).toEqual([]);
    });
});

describe('updateLabels', () => {
    it('updates labelIds and labelName for selected file', () => {
        const selectedKeys = new Set([fileA.id]);
        const newLabelIds = [...fileA.labelIds, 'label4'];
        const updated = updateLabels(selectedKeys, newLabelIds)(fileA);
        expect(updated.labelIds).toEqual(newLabelIds);
    });

    it('does not update file if not selected', () => {
        const selectedKeys = new Set([fileB.id]);
        const newLabelIds = ['label7'];
        const updated = updateLabels(selectedKeys, newLabelIds)(fileA);
        expect(updated).toEqual(fileA);
    });

    it('updates all files if selectedKeys is "all"', () => {
        const selectedKeys = 'all';
        const newLabelIds = ['label8'];
        const updatedA = updateLabels(selectedKeys, newLabelIds)(fileA);

        expect(updatedA.labelIds).toEqual(newLabelIds);
    });
});

describe('toggleMultipleSelection', () => {
    const files = [fileA, fileB, fileC];

    it('returns empty set if selectedItems is "all"', () => {
        const selectedItems = 'all';
        expect(toggleMultipleSelection(files)(selectedItems)).toEqual(new Set());
    });

    it('selects all items if none are selected', () => {
        const selectedItems: Selection = new Set();
        expect(toggleMultipleSelection(files)(selectedItems)).toEqual(new Set(getIds(files)));
    });

    it('selects all items if some are selected', () => {
        const selectedItems = new Set([fileA.id]);
        expect(toggleMultipleSelection(files)(selectedItems)).toEqual(new Set(getIds(files)));
    });

    it('deselects all items if all are selected', () => {
        const selectedItems = new Set(getIds(files));
        expect(toggleMultipleSelection(files)(selectedItems)).toEqual(new Set());
    });

    it('selects all items if selectedItems is a subset', () => {
        const selectedItems = new Set([fileB.id]);
        expect(toggleMultipleSelection(files)(selectedItems)).toEqual(new Set(getIds(files)));
    });

    it('returns empty set if currentFiles is empty', () => {
        const selectedItems = new Set([fileA.id]);
        expect(toggleMultipleSelection([])(selectedItems)).toEqual(new Set());
    });
});

describe('toggleItemSelection', () => {
    it('adds id to empty selection', () => {
        const prevValues = new Set() as Selection;

        expectSetToEqual(toggleItemSelection(fileA.id)(prevValues), (result) => {
            expect(result.has(fileA.id)).toBe(true);
            expect(result.size).toBe(1);
        });
    });

    it('removes id if already selected', () => {
        const prevValues = new Set([fileA.id]);

        expectSetToEqual(toggleItemSelection(fileA.id)(prevValues), (result) => {
            expect(result.has(fileA.id)).toBe(false);
            expect(result.size).toBe(0);
        });
    });

    it('adds id if not present in non-empty selection', () => {
        const prevValues = new Set([fileA.id, fileB.id]);

        expectSetToEqual(toggleItemSelection(fileC.id)(prevValues), (result) => {
            expect(result.has(fileC.id)).toBe(true);
            expect(result.size).toBe(3);
        });
    });

    it('removes id and keeps others', () => {
        const prevValues = new Set([fileA.id, fileB.id, fileC.id]);

        expectSetToEqual(toggleItemSelection(fileB.id)(prevValues), (result) => {
            expect(result.has(fileB.id)).toBe(false);
            expect(result.has(fileA.id)).toBe(true);
            expect(result.has(fileC.id)).toBe(true);
            expect(result.size).toBe(2);
        });
    });

    it('returns "all" if prevValues is "all"', () => {
        const prevValues = 'all';

        expect(toggleItemSelection(fileA.id)(prevValues)).toBe('all');
    });
});

describe('removeMultipleSelections', () => {
    it('removes multiple ids from selection', () => {
        const prevValues = new Set([fileA.id, fileB.id, fileC.id]);

        expectSetToEqual(removeMultipleSelections([fileA.id, fileC.id])(prevValues), (result) => {
            expect(result.has(fileA.id)).toBe(false);
            expect(result.has(fileC.id)).toBe(false);
            expect(result.has(fileB.id)).toBe(true);
            expect(result.size).toBe(1);
        });
    });

    it('removes ids that are not present without error', () => {
        const prevValues = new Set([fileA.id]);

        expectSetToEqual(removeMultipleSelections(['nonexistent'])(prevValues), (result) => {
            expect(result.has(fileA.id)).toBe(true);
            expect(result.size).toBe(1);
        });
    });

    it('returns original selection if prevValues is "all"', () => {
        const prevValues = 'all';

        expect(removeMultipleSelections([fileA.id, fileB.id])(prevValues)).toBe('all');
    });

    it('removes nothing if ids array is empty', () => {
        const prevValues = new Set([fileA.id, fileB.id]);

        expectSetToEqual(removeMultipleSelections([])(prevValues), (result) => {
            expect(result.has(fileA.id)).toBe(true);
            expect(result.has(fileB.id)).toBe(true);
            expect(result.size).toBe(2);
        });
    });

    it('removes all if all ids are present', () => {
        const prevValues = new Set([fileA.id, fileB.id]);

        expectSetToEqual(removeMultipleSelections([fileA.id, fileB.id])(prevValues), (result) => {
            expect(result.size).toBe(0);
        });
    });
});
