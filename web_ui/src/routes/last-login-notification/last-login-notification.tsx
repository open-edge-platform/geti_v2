// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { useEffect } from 'react';

import { toast } from '@geti/ui';
import { useLocalStorage } from 'usehooks-ts';

import { useIsSaasEnv } from '../../hooks/use-is-saas-env/use-is-saas-env.hook';
import { usePreviousSignIn } from '../../shared/hooks/use-previous-sign-in.hook';
import { LOCAL_STORAGE_KEYS } from '../../shared/local-storage-keys';

export const LastLoginNotification = () => {
    const isSaaS = useIsSaasEnv();
    const { lastLoginDate, userId } = usePreviousSignIn();
    const [lastLoginInfo, setLastLoginInfo] = useLocalStorage<string>(LOCAL_STORAGE_KEYS.LAST_LOGIN_INFO, '');

    useEffect(() => {
        if (isSaaS) {
            if (`${userId}-${lastLoginDate}` !== lastLoginInfo && lastLoginDate) {
                toast({
                    message: `Your previous sign-in was \n${lastLoginDate}`,
                    type: 'neutral',
                    position: 'top-right',
                });

                setLastLoginInfo(`${userId}-${lastLoginDate}`);
            }
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSaaS, lastLoginDate, lastLoginInfo, userId]);

    return <></>;
};
