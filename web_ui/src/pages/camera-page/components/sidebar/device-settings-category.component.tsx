// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { Disclosure, DisclosurePanel, DisclosureTitle } from '@geti/ui';
import { isEqual } from 'lodash-es';

import { useDeviceSettings } from '../../providers/device-settings-provider.component';
import { DeviceConfiguration, isSettingVisible, SettingMinMax, SettingSelection } from '../../providers/util';
import { settingsMetadata } from './device-settings-metadata';
import { SettingOption } from './setting-option.component';

import classes from './device-settings-category.module.css';

interface DeviceSettingsCategoryProps {
    name: string;
    configuration: DeviceConfiguration[];
}

export const DeviceSettingsCategory = ({ name, configuration }: DeviceSettingsCategoryProps) => {
    const { dependencies } = settingsMetadata;

    const { deviceConfig, setDeviceConfig } = useDeviceSettings();

    const updateDeviceConfig = (configName: string, value: string | number) => {
        setDeviceConfig([
            ...deviceConfig.map((currentConfig) => {
                if (isEqual(configName, currentConfig.name)) {
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
        <Disclosure isHidden={!configuration.length}>
            <DisclosureTitle UNSAFE_className={classes.sectionHeader}>{name}</DisclosureTitle>
            <DisclosurePanel>
                {configuration.map((currentOption) => {
                    const shouldDisplay = isSettingVisible(currentOption, deviceConfig, dependencies);
                    const { name: optionName, config, onChange } = currentOption;

                    const handleOnChange = (value: number | string) => {
                        onChange(value);
                        updateDeviceConfig(optionName, value);
                    };

                    return (
                        shouldDisplay && (
                            <SettingOption
                                key={`${optionName}-${shouldDisplay}`}
                                label={optionName}
                                config={config}
                                onChange={handleOnChange}
                            />
                        )
                    );
                })}
            </DisclosurePanel>
        </Disclosure>
    );
};
