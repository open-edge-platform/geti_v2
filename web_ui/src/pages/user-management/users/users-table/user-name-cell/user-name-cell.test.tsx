// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { screen } from '@testing-library/react';

import { getMockedUser } from '../../../../../test-utils/mocked-items-factory/mocked-users';
import { providersRender as render } from '../../../../../test-utils/required-providers-render';
import { getFullNameFromUser } from '../utils';
import { UserNameCell } from './user-name-cell.component';

describe('UsernameCell', () => {
    const mockedUser = getMockedUser({ id: 'user-id' });
    const fullName = getFullNameFromUser(mockedUser);

    it('shows the user full name within the cell', async () => {
        render(
            <UserNameCell
                dataKey={mockedUser.id}
                id={mockedUser.id}
                userPhoto={null}
                fullName={fullName}
                email={mockedUser.email}
                cellData={fullName}
            />
        );

        expect(screen.getByText(fullName)).toBeInTheDocument();
    });
});
