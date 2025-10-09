// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

// Custom error used to indicate an authenticated user has zero accessible workspaces
// so that the global ErrorBoundary can display a dedicated screen.
export class NoWorkspacesError extends Error {
    constructor(message = 'No accessible workspaces') {
        super(message);
        this.name = 'NoWorkspacesError';
    }
}
