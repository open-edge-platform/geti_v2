// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { ReactNode, useMemo } from 'react';

import { getErrorMessage } from '@geti/core/src/services/utils';
import { toast } from '@geti/ui';
import {
    DefaultOptions,
    QueryCache,
    QueryClient,
    QueryClientProvider as TanstackQueryClientProvider,
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { isAxiosError } from 'axios';

declare module '@tanstack/react-query' {
    interface Register {
        queryMeta: {
            notifyOnError?: boolean;
            errorMessage?: string;
            disableGlobalErrorHandling?: boolean;
        };
        mutationMeta: {
            notifyOnError?: boolean;
        };
    }
}

export const QueryClientProvider = ({
    children,
    defaultQueryOptions,
}: {
    children: ReactNode;
    defaultQueryOptions?: DefaultOptions;
}) => {
    const queryClient = useMemo(() => {
        const queryCache = new QueryCache({
            onError: (error, query) => {
                if (isAxiosError(error) && query.meta && 'notifyOnError' in query.meta) {
                    const message = query.meta.errorMessage;
                    if (query.meta.notifyOnError === true) {
                        toast({
                            message: typeof message === 'string' ? message : getErrorMessage(error),
                            type: 'error',
                        });
                    }
                }

                if (query.meta && 'disableGlobalErrorHandling' in query.meta) {
                    if (query.meta.disableGlobalErrorHandling === true) {
                        return;
                    }
                }
            },
        });

        return new QueryClient({
            defaultOptions: {
                queries: {
                    refetchIntervalInBackground: false,
                    refetchOnWindowFocus: false,
                },
                ...defaultQueryOptions,
            },
            queryCache,
        });
    }, [defaultQueryOptions]);

    return (
        <TanstackQueryClientProvider client={queryClient}>
            {children}

            {process.env.REACT_APP_REACT_QUERY_TOOL === 'true' && <ReactQueryDevtools initialIsOpen={false} />}
        </TanstackQueryClientProvider>
    );
};
