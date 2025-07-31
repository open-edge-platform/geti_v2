// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { Key } from 'react';

import { Selection } from '@geti/ui';

import { getIds } from '../../../../../shared/utils';
import { mockFile } from '../../../../../test-utils/mockFile';
import { getSelectedLabelIds, PreviewFile, toggleSelection, updateLabels } from './utils';

const fileA = { id: '1', file: mockFile({}), labelIds: ['label1', 'label2'] };
const fileB = { ...fileA, id: '2', labelIds: ['label3'] };
const fileC = { ...fileA, id: '3', labelIds: [] };

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

    it('replaces labelIds if newLabelIds is shorter or equal in length', () => {
        const selectedKeys = new Set([fileA.id]);
        const newLabelIds = ['label5'];
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

    it('returns original item if not selected and selectedKeys is not "all"', () => {
        const selectedKeys = new Set(['nonexistent']);
        const newLabelIds = ['label9'];
        const updated = updateLabels(selectedKeys, newLabelIds)(fileA);
        expect(updated).toEqual(fileA);
    });
});
describe('toggleSelection', () => {
    const files = [fileA, fileB, fileC];

    it('returns empty set if selectedItems is "all"', () => {
        const selectedItems = 'all';
        expect(toggleSelection(files)(selectedItems)).toEqual(new Set());
    });

    it('selects all items if none are selected', () => {
        const selectedItems: Selection = new Set();
        expect(toggleSelection(files)(selectedItems)).toEqual(new Set(getIds(files)));
    });

    it('selects all items if some are selected', () => {
        const selectedItems = new Set([fileA.id]);
        expect(toggleSelection(files)(selectedItems)).toEqual(new Set(getIds(files)));
    });

    it('deselects all items if all are selected', () => {
        const selectedItems = new Set(getIds(files));
        expect(toggleSelection(files)(selectedItems)).toEqual(new Set());
    });

    it('selects all items if selectedItems is a subset', () => {
        const selectedItems = new Set([fileB.id]);
        expect(toggleSelection(files)(selectedItems)).toEqual(new Set(getIds(files)));
    });

    it('returns empty set if currentFiles is empty', () => {
        const selectedItems = new Set([fileA.id]);
        expect(toggleSelection([])(selectedItems)).toEqual(new Set());
    });
});
