// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { Flex, Heading, Item, Picker, View } from '@geti/ui';
import { isEqual, isUndefined } from 'lodash-es';

import { useDeviceSettings } from '../../providers/device-settings-provider.component';
import { DeviceSettingsCategory } from './device-settings-category.component';
import { settingsMetadata } from './device-settings-metadata';

const Header = ({ text }: { text: string }) => (
    <Flex alignItems={'center'} justifyContent={'space-between'}>
        <Heading level={3}>{text}</Heading>
    </Flex>
);

export const DeviceSettings = () => {
    const { categories, defaultCategory } = settingsMetadata;

    const { videoDevices, selectedDeviceId, deviceConfig, setSelectedDeviceId } = useDeviceSettings();

    const settingsMetadataFieldsKeys = categories.reduce(
        (list: string[], category) => [...list, ...category.attributesKeys],
        []
    );

    const defaultCategoryAttributesKeys = deviceConfig?.filter(
        ({ name }) => !settingsMetadataFieldsKeys.includes(name)
    );

    return (
        <View position={'relative'}>
            <Header text={'Camera Settings'} />

            <Picker
                width={'100%'}
                label={'Device'}
                items={videoDevices}
                aria-label={'devices'}
                selectedKey={selectedDeviceId}
                placeholder={'Integrated Camera'}
                onSelectionChange={(key) => setSelectedDeviceId(String(key))}
            >
                {({ deviceId, label }) => <Item key={deviceId}>{label}</Item>}
            </Picker>

            {categories.map(({ categoryName, attributesKeys }) => {
                const configuration = attributesKeys
                    .map((key) => {
                        return deviceConfig.find(({ name }) => isEqual(name, key));
                    })
                    .filter((config) => !isUndefined(config));

                return <DeviceSettingsCategory name={categoryName} configuration={configuration} key={categoryName} />;
            })}
            <DeviceSettingsCategory name={defaultCategory} configuration={defaultCategoryAttributesKeys} />
        </View>
    );
};
