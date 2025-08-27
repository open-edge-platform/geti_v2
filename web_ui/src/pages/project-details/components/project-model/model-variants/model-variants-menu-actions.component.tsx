// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { useApplicationServices } from '@geti/core/src/services/application-services-provider.component';
import { toast } from '@geti/ui';

import { MenuTriggerList } from '../../../../../shared/components/menu-trigger-list/menu-trigger-list.component';
import { downloadFile, getDownloadNotificationMessage, isNonEmptyString } from '../../../../../shared/utils';
import { DownloadCell } from './download-cell/download-cell.component';

interface ModelVariantsMenuActionsProps {
    modelId: string;
    downloadUrl?: string;
    handleOpenRunTest: () => void;
}

export const ModelVariantsMenuActions = ({
    modelId,
    downloadUrl,
    handleOpenRunTest,
}: ModelVariantsMenuActionsProps): JSX.Element => {
    const { router } = useApplicationServices();

    const downloadHandler = () => {
        if (!isNonEmptyString(downloadUrl)) {
            return;
        }

        downloadFile(router.PREFIX(downloadUrl));
        toast({ message: getDownloadNotificationMessage('model'), type: 'info' });
    };

    const menuOptions: [string, () => void][] = [
        ['Run tests', handleOpenRunTest],
        ['Download', downloadHandler],
    ];

    return (
        <>
            <DownloadCell id={modelId} onDownload={downloadHandler} aria-label={'download model'} />
            <MenuTriggerList
                id={`optimized-model-action-menu-${modelId}`}
                options={menuOptions}
                ariaLabel={'Model action menu'}
            />
        </>
    );
};
