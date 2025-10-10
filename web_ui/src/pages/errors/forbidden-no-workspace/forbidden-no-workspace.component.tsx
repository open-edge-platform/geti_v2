// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { useEffect } from 'react';

import { Button, Heading, Text } from '@geti/ui';
import isFunction from 'lodash-es/isFunction';

import { Forbidden } from '../../../assets/images';
import { useHandleSignOut } from '../../../hooks/use-handle-sign-out/use-handle-sign-out.hook';

import classes from '../error-layout/error-layout.module.scss';

interface ForbiddenNoWorkspaceProps {
    onReset?: () => void;
}

export const ForbiddenNoWorkspace = ({ onReset }: ForbiddenNoWorkspaceProps) => {
    useEffect(() => {
        const previousHtmlTitle = document.title;
        document.title = 'No workspaces';
        return () => {
            document.title = previousHtmlTitle;
        };
    }, []);

    const handleSignOut = useHandleSignOut();

    return (
        <>
            <Forbidden />
            <Heading UNSAFE_className={classes.errorMessageHeader}>No workspace access</Heading>
            <Text UNSAFE_className={classes.errorMessage}>
                You don&apos;t have access to any workspaces in this organization yet. An organization administrator
                must assign you to a workspace before you can continue.
            </Text>
            <Text UNSAFE_className={classes.errorMessage}>
                If you believe this is a mistake, contact an administrator or try refreshing later.
            </Text>
            <Button
                variant={'accent'}
                onPress={() => {
                    isFunction(onReset) && onReset();
                    handleSignOut();
                }}
                marginTop={'size-200'}
            >
                Sign out
            </Button>
        </>
    );
};
