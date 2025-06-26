// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { Disclosure, DisclosurePanel, DisclosureTitle, Flex, Heading, Item, Key, Picker, View } from '@geti/ui';
import { isEqual } from 'lodash-es';

import { useDeviceSettings } from '../../providers/device-settings-provider.component';
import { checkIfDisplaySetting, SettingMinMax, SettingSelection } from '../../providers/util';
import { DeviceSettingsDefaultCategory } from './device-settings-default-category.component';
import { settingsMetadata } from './device-settings-metadata';
import { SettingOption } from './setting-option.component';

import classes from './device-settings.module.css';

const Header = ({ text }: { text: string }) => (
    <Flex alignItems={'center'} justifyContent={'space-between'}>
        <Heading level={3}>{text}</Heading>
    </Flex>
);

//TODO:
//add tests!
//debouncing!!!
//layout

export const DeviceSettings = () => {
    const { categories, dependencies } = settingsMetadata;

    const { videoDevices, selectedDeviceId, deviceConfig, setDeviceConfig, setSelectedDeviceId } = useDeviceSettings();

    const updateDeviceConfig = (name: string, value: string | number) => {
        setDeviceConfig([
            ...deviceConfig.map((currentConfig) => {
                if (isEqual(name, currentConfig.name)) {
                    return {
                        ...currentConfig,
                        config: { ...currentConfig.config, value } as SettingMinMax | SettingSelection,
                    };
                } else {
                    return currentConfig;
                }
            }),
        ]);
    };

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
                onSelectionChange={(key: Key) => setSelectedDeviceId(String(key))}
            >
                {({ deviceId, label }) => <Item key={deviceId}>{label}</Item>}
            </Picker>

            {categories.map(({ categoryName, attributesKeys }) => (
                <Disclosure key={categoryName}>
                    <DisclosureTitle UNSAFE_className={classes.sectionHeader}>{categoryName}</DisclosureTitle>
                    <DisclosurePanel>
                        {attributesKeys.map((key) => {
                            const currentOption = deviceConfig.find((option) => option.name === key);
                            if (currentOption) {
                                const shouldDisplay = checkIfDisplaySetting(currentOption, deviceConfig, dependencies);
                                const { name, config, onChange } = currentOption;

                                const handleOnChange = (value: number | string) => {
                                    onChange(value);
                                    updateDeviceConfig(name, value);
                                };

                                return (
                                    shouldDisplay && (
                                        <SettingOption
                                            key={`${name}-${shouldDisplay}`}
                                            label={name}
                                            config={config}
                                            onChange={handleOnChange}
                                        />
                                    )
                                );
                            }
                        })}
                    </DisclosurePanel>
                </Disclosure>
            ))}

            <DeviceSettingsDefaultCategory deviceConfig={deviceConfig} />
        </View>
    );
};
