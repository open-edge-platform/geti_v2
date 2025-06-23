// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { useOverlayTriggerState } from '@react-stately/overlays';
import { screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { NOTIFICATION_TYPE } from '../../../../notification/notification-toast/notification-type.enum';
import { providersRender as render } from '../../../../test-utils/required-providers-render';
import { CREATE_ERROR, CreatePersonalAccessTokenDialog } from './create-personal-access-token-dialog.component';

const App = () => {
    const createPersonalAccessTokenDialogState = useOverlayTriggerState({});

    return (
        <>
            <button onClick={createPersonalAccessTokenDialogState.open}>Open</button>
            <CreatePersonalAccessTokenDialog
                triggerState={createPersonalAccessTokenDialogState}
                userId={'2'}
                organizationId={'3'}
            />
        </>
    );
};

jest.mock('@geti/core/src/users/hook/use-users.hook', () => ({
    useUsers: jest.fn(() => ({
        useActiveUser: () => ({
            data: {},
            isPending: false,
        }),
    })),
}));

const mockMutate = jest.fn();
jest.mock('../../../../core/personal-access-tokens/hooks/use-personal-access-token.hook', () => ({
    usePersonalAccessToken: () => ({
        createPersonalAccessTokenMutation: {
            mutate: mockMutate,
            isPending: false,
            data: undefined,
        },
    }),
}));

const mockAddNotification = jest.fn();
jest.mock('../../../../notification/notification.component', () => ({
    ...jest.requireActual('../../../../notification/notification.component'),
    useNotification: () => ({ addNotification: mockAddNotification }),
}));

describe('CreatePersonalAccessTokenDialog', () => {
    const renderApp = async () => {
        const result = render(<App />);

        await userEvent.click(screen.getByRole('button', { name: 'Open' }));

        return result;
    };

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('Open and close modal', async () => {
        await renderApp();

        expect(screen.getByText('Personal Access Token')).toBeInTheDocument();

        await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

        await waitFor(() => {
            expect(screen.queryByText('Personal Access Token')).not.toBeInTheDocument();
        });
    });

    it('Create is disabled with invalid dates', async () => {
        await renderApp();

        expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    it('renders Copy options', async () => {
        mockMutate.mockImplementation((_data, { onSuccess }) => {
            onSuccess({ token: 'fake-token' });
        });

        await renderApp();

        const nameTextField = screen.getByLabelText(/name/i);

        await userEvent.type(nameTextField, 'some api key name');
        const selectDateButton = screen.getByLabelText('Calendar');
        await userEvent.click(selectDateButton);
        const firstDate = screen.getByRole('button', { name: /First available date$/i });
        await userEvent.click(firstDate);

        await userEvent.click(screen.getByRole('button', { name: 'Create' }));

        await waitFor(() => {
            expect(screen.getByLabelText('copy-api-key')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
        });
    });

    it('shows error notification when create fails', async () => {
        const errorMessage = 'error test';

        mockMutate.mockImplementation((_data, { onError }) => {
            onError?.({ message: errorMessage });
        });

        await renderApp();

        const nameTextField = screen.getByLabelText(/name/i);
        await userEvent.type(nameTextField, 'some api key name');
        const selectDateButton = screen.getByLabelText('Calendar');
        await userEvent.click(selectDateButton);
        const firstDate = screen.getByRole('button', { name: /First available date$/i });
        await userEvent.click(firstDate);

        await userEvent.click(screen.getByRole('button', { name: 'Create' }));

        await waitFor(() => {
            expect(mockAddNotification).toHaveBeenCalledWith({
                message: errorMessage,
                type: NOTIFICATION_TYPE.ERROR,
            });
        });
    });

    it('shows default error notification when create fails without message', async () => {
        mockMutate.mockImplementation((_data, { onError }) => {
            onError();
        });

        await renderApp();

        const nameTextField = screen.getByLabelText(/name/i);
        await userEvent.type(nameTextField, 'some api key name');
        const selectDateButton = screen.getByLabelText('Calendar');
        await userEvent.click(selectDateButton);
        const firstDate = screen.getByRole('button', { name: /First available date$/i });
        await userEvent.click(firstDate);

        await userEvent.click(screen.getByRole('button', { name: 'Create' }));

        await waitFor(() => {
            expect(mockAddNotification).toHaveBeenCalledWith({
                message: CREATE_ERROR,
                type: NOTIFICATION_TYPE.ERROR,
            });
        });
    });
});
