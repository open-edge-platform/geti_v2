// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { useApplicationServices } from '@geti/core/src/services/application-services-provider.component';
import { toast } from '@geti/ui';

import { downloadFile, getDownloadNotificationMessage } from '../../shared/utils';
import { DownloadButton } from './download-button.component';

interface DownloadServerInfoProps {
    url: string;
    exportName: string;
}

export const DownloadServerInfo = ({ exportName, url }: DownloadServerInfoProps) => {
    const { router } = useApplicationServices();

    const handlePress = () => {
        downloadFile(router.PREFIX(url));

        toast({ message: getDownloadNotificationMessage(exportName), type: 'info' });
    };

    return <DownloadButton exportName={exportName} handlePress={handlePress} />;
};
