// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { useMemo } from 'react';

import { useFeatureFlags } from '@geti/core/src/feature-flags/hooks/use-feature-flags.hook';

import { useProjectIdentifier } from '../../../hooks/use-project-identifier/use-project-identifier';
import { isNotCropDomain } from '../../../shared/utils';
import { useProjectActions } from '../../projects/hooks/use-project-actions.hook';
import { TaskWithSupportedAlgorithms } from '../supported-algorithms.interface';
import { useLegacySupportedAlgorithms, useSupportedAlgorithms } from './use-supported-algorithms.hook';

interface UseTasksWithSupportedAlgorithms {
    tasksWithSupportedAlgorithms: TaskWithSupportedAlgorithms;
}

export const useTasksWithSupportedAlgorithms = (): UseTasksWithSupportedAlgorithms => {
    const projectIdentifier = useProjectIdentifier();
    const { useGetProject } = useProjectActions();
    const { data: project } = useGetProject(projectIdentifier);
    const { FEATURE_FLAG_NEW_CONFIGURABLE_PARAMETERS } = useFeatureFlags();

    const { data: legacySupportedAlgorithms } = useLegacySupportedAlgorithms(projectIdentifier);
    const { data: supportedAlgorithms } = useSupportedAlgorithms(projectIdentifier);

    const tasksWithSupportedAlgorithms: TaskWithSupportedAlgorithms = useMemo(() => {
        if (supportedAlgorithms === undefined || project?.tasks === undefined) {
            return {};
        }

        return project.tasks.reduce<TaskWithSupportedAlgorithms>((prev, curr) => {
            if (!isNotCropDomain(curr.domain)) {
                return prev;
            }

            return {
                [curr.id]: supportedAlgorithms.filter(
                    ({ domain }) => isNotCropDomain(domain) && domain === curr.domain
                ),
                ...prev,
            };
        }, {});
    }, [supportedAlgorithms, project?.tasks]);

    const legacyTasksWithSupportedAlgorithms: TaskWithSupportedAlgorithms = useMemo(() => {
        if (legacySupportedAlgorithms === undefined || project?.tasks === undefined) {
            return {};
        }

        return project.tasks.reduce<TaskWithSupportedAlgorithms>((prev, curr) => {
            if (!isNotCropDomain(curr.domain)) {
                return prev;
            }

            return {
                [curr.id]: legacySupportedAlgorithms.filter(
                    ({ domain }) => isNotCropDomain(domain) && domain === curr.domain
                ),
                ...prev,
            };
        }, {});
    }, [project?.tasks, legacySupportedAlgorithms]);

    return {
        tasksWithSupportedAlgorithms: FEATURE_FLAG_NEW_CONFIGURABLE_PARAMETERS
            ? tasksWithSupportedAlgorithms
            : legacyTasksWithSupportedAlgorithms,
    };
};
