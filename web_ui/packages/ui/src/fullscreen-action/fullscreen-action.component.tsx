// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { ReactNode } from 'react';

import {
    ActionButton,
    ButtonGroup,
    Content,
    Dialog,
    DialogTrigger,
    Divider,
    Heading,
    Tooltip,
    TooltipTrigger,
} from '@adobe/react-spectrum';

import { Collapse, Expand } from '../../icons';

import classes from './fullscreen-dialog.module.scss';

interface FullscreenActionProps {
    children: ReactNode;
    title?: string | ReactNode;
    actionButton?: ReactNode;
    id?: string;
}

export const FullscreenAction = ({ children, title, actionButton, id }: FullscreenActionProps): JSX.Element => {
    return (
        <DialogTrigger type='fullscreenTakeover'>
            <TooltipTrigger placement={'bottom'}>
                <ActionButton isQuiet id={`${id}-open-fullscreen`} aria-label={`Open in fullscreen ${title}`}>
                    <Expand />
                </ActionButton>
                <Tooltip>Fullscreen</Tooltip>
            </TooltipTrigger>

            {(close) => (
                <Dialog UNSAFE_className={classes.fullscreenDialog} aria-label={`${title} fullscreen`}>
                    <Heading UNSAFE_className={classes.fullscreenHeading}>{title}</Heading>

                    <Divider />

                    <ButtonGroup>
                        {actionButton}

                        <TooltipTrigger placement={'bottom'}>
                            <ActionButton isQuiet onPress={close} aria-label='Close fullscreen'>
                                <Collapse />
                            </ActionButton>
                            <Tooltip>Close fullscreen</Tooltip>
                        </TooltipTrigger>
                    </ButtonGroup>

                    <Content UNSAFE_className={classes.fullscreenContent}>{children}</Content>
                </Dialog>
            )}
        </DialogTrigger>
    );
};
