// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { ComponentProps, Key } from 'react';

import { USER_ROLE } from '@geti/core/src/users/users.interface';
import { Item, Picker } from '@geti/ui';
import { capitalize, isEmpty } from 'lodash-es';

interface RolePickerProps<T> extends Omit<ComponentProps<typeof Picker>, 'children'> {
    roles: T[];
    selectedRole: T | undefined;
    setSelectedRole: (user: T) => void;
    emptyItem?: string;
    testId?: string;
    label?: ComponentProps<typeof Picker>['label'] | boolean;
}

export const RolePicker = <T extends USER_ROLE>({
    roles,
    selectedRole,
    setSelectedRole,
    emptyItem,
    testId = 'roles-add-user',
    label,
    ...pickerProps
}: RolePickerProps<T>) => {
    const rolesItems = roles.map((role) => ({ key: role, text: role }));
    const items = isEmpty(emptyItem) ? rolesItems : [...rolesItems, { key: '', text: emptyItem }];
    const labelContent = label || 'Role';

    const onSelectionChange = (key: Key) => {
        setSelectedRole(key as T);
    };

    return (
        <Picker
            {...pickerProps}
            label={label !== false ? labelContent : undefined}
            placeholder={'Select a role'}
            items={items}
            id='roles-add-user'
            data-testid={testId}
            onSelectionChange={(key) => key !== null && onSelectionChange(key)}
            selectedKey={selectedRole ?? ''}
        >
            {(item) => (
                <Item key={item.key} textValue={item.text}>
                    {capitalize(item.text)}
                </Item>
            )}
        </Picker>
    );
};
