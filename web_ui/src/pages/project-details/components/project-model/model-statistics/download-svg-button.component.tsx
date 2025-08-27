// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { useState } from 'react';

import {
    ActionButton,
    toast,
    Tooltip,
    TooltipTrigger,
    View,
    type ActionButtonProps,
    type BackgroundColorValue,
} from '@geti/ui';
import { DownloadIcon } from '@geti/ui/icons';

import {
    DOWNLOADABLE_HTML_SELECTOR,
    DOWNLOADABLE_SVG_SELECTOR,
    downloadMultiplePages,
    ERROR_MESSAGE,
    getContainerElements,
    getVarColorToHex,
} from '../../../../../shared/components/download-graph-menu/export-svg-utils';

import classes from './download-svg-button.module.scss';

interface DownloadSvgButtonProps extends ActionButtonProps {
    text?: string;
    tooltip?: string;
    fileName: string;
    container: React.RefObject<HTMLElement>;
    graphBackgroundColor: BackgroundColorValue;
}

export const DownloadSvgButton = ({
    text = '',
    fileName,
    container,
    gridArea,
    marginStart,
    marginBottom,
    tooltip = text,
    graphBackgroundColor,
    ...props
}: DownloadSvgButtonProps) => {
    const [isDownloading, setIsDownloading] = useState(false);
    const hexColor = getVarColorToHex(`--spectrum-global-color-${graphBackgroundColor}`);

    const onDownloadPdf = async () => {
        setIsDownloading(true);
        try {
            const svgs = getContainerElements<SVGSVGElement>(container.current, DOWNLOADABLE_SVG_SELECTOR);
            const htmls = getContainerElements<HTMLDivElement>(container.current, DOWNLOADABLE_HTML_SELECTOR);

            await downloadMultiplePages(fileName, svgs, htmls, hexColor);
        } catch (_e) {
            toast({ message: ERROR_MESSAGE, type: 'error' });
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <View
            gridArea={gridArea}
            marginStart={marginStart}
            marginBottom={marginBottom}
            UNSAFE_style={{ width: 'fit-content' }}
        >
            <TooltipTrigger placement={'bottom'}>
                <ActionButton
                    isQuiet
                    onPress={onDownloadPdf}
                    isDisabled={isDownloading}
                    {...props}
                    aria-label='download svg'
                    UNSAFE_className={classes.downloadAllGraphs}
                >
                    {text} <DownloadIcon />
                </ActionButton>
                <Tooltip>{tooltip}</Tooltip>
            </TooltipTrigger>
        </View>
    );
};
