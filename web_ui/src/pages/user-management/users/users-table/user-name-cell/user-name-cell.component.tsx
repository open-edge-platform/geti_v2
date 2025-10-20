// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { Flex } from '@geti/ui';

import { UserPhotoPresentation } from '../../../profile-page/user-photo-container/user-photo-presentation.component';

import classes from './user-name-cell.module.scss';

interface EmailCellProps {
    cellData: string;
    dataKey: string;
    email: string;
    id: string;
    userPhoto: string | null;
    fullName: string;
}

export const UserNameCell = ({ cellData, dataKey, id, userPhoto, fullName, email }: EmailCellProps) => {
    return (
        <Flex alignItems='center' gap='size-200' id={`${id}-${dataKey}`} width={'100%'}>
            <UserPhotoPresentation
                key={id}
                userName={fullName}
                email={email}
                userPhoto={userPhoto}
                handleUploadClick={null}
                width={'size-300'}
                height={'size-300'}
            />

            <span title={cellData} id={'user-name-cell'} className={classes.emailCellTitle}>
                {cellData}
            </span>
        </Flex>
    );
};
