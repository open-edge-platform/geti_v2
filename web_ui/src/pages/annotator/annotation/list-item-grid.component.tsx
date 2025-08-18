// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { ReactNode } from 'react';

import { Flex, Grid, type FlexProps } from '@geti/ui';
import { clsx } from 'clsx';

import classes from './list-item-grid.module.scss';

interface ListItemGridProps {
    id: string;
    isLast: boolean;
    isSelected: boolean;
    ariaLabel: string;
    children: ReactNode;
    onHoverEnd: () => void;
    onHoverStart: () => void;
}

export const ListItemGrid = ({
    id,
    isLast,
    children,
    ariaLabel,
    isSelected,
    onHoverStart,
    onHoverEnd,
}: ListItemGridProps) => {
    return (
        <div
            id={id}
            onPointerOver={onHoverStart}
            onPointerOut={onHoverEnd}
            role={'listitem'}
            aria-label={ariaLabel}
            className={clsx({
                [classes.annotationItem]: true,
                [classes.lastAnnotationItem]: isLast,
                [classes.selectedAnnotation]: isSelected,
            })}
        >
            <Grid
                justifyContent={'left'}
                alignItems={'center'}
                minHeight={'size-400'}
                columns={['auto', 'auto', '1fr', 'auto', 'auto']}
                areas={['checkbox color labels list-menu actions-menu']}
                UNSAFE_className={classes.listItemGrid}
            >
                {children}
            </Grid>
        </div>
    );
};

const Checkbox = ({ children, ...otherProps }: FlexProps) => {
    return (
        <Flex {...otherProps} gridArea={'checkbox'}>
            {children}
        </Flex>
    );
};

const Color = ({ children, ...otherProps }: FlexProps) => {
    return (
        <Flex {...otherProps} gridArea={'color'}>
            {children}
        </Flex>
    );
};

const Labels = ({ children, ...otherProps }: FlexProps) => {
    return (
        <Flex {...otherProps} gridArea={'labels'}>
            {children}
        </Flex>
    );
};

const ListMenu = ({ children }: FlexProps) => {
    return <Flex gridArea={'list-menu'}>{children}</Flex>;
};

const ActionsMenu = ({ children, ...otherProps }: FlexProps) => {
    return (
        <Flex {...otherProps} gridArea={'actions-menu'}>
            {children}
        </Flex>
    );
};

ListItemGrid.ListMenu = ListMenu;
ListItemGrid.Checkbox = Checkbox;
ListItemGrid.Color = Color;
ListItemGrid.Labels = Labels;
ListItemGrid.ActionsMenu = ActionsMenu;
