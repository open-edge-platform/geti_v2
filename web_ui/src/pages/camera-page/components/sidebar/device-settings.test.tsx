// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { defaultTheme, Provider as ThemeProvider } from '@geti/ui';
import { fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { SettingsContextProps, useDeviceSettings } from '../../providers/device-settings-provider.component';
import { getUseCameraSettings } from '../../test-utils/camera-setting';
import { DeviceSettings } from './device-settings.component';

jest.mock('../../providers/util', () => ({
    ...jest.requireActual('../../providers/util'),
    applySettings: jest.fn(),
}));

jest.mock('../../providers/device-settings-provider.component', () => ({
    useDeviceSettings: jest.fn(),
}));

const getMockedDevice = (number: number) =>
    ({
        kind: 'videoinput',
        label: `camera-${number}`,
        groupId: `groupId-${number}`,
        deviceId: `deviceId-${number}`,
    }) as MediaDeviceInfo;

describe('Settings', () => {
    const renderApp = (config: Partial<SettingsContextProps & { stream: unknown }> = {}) => {
        jest.mocked(useDeviceSettings).mockReturnValue(getUseCameraSettings(config));

        render(
            <ThemeProvider theme={defaultTheme}>
                <DeviceSettings />
            </ThemeProvider>
        );
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('update selected device id', async () => {
        const cameraOne = getMockedDevice(1);
        const cameraTwo = getMockedDevice(2);
        const videoDevices = [cameraOne, cameraTwo];
        const mockedSetSelectedDeviceId = jest.fn();

        renderApp({ videoDevices, setSelectedDeviceId: mockedSetSelectedDeviceId });

        fireEvent.click(screen.getByLabelText('devices'));

        await userEvent.selectOptions(
            screen.getByRole('listbox'),
            screen.getByRole('option', { name: cameraTwo.label })
        );

        expect(mockedSetSelectedDeviceId).toHaveBeenCalledWith(cameraTwo.deviceId);
    });

    it('Allows to mirror the camera feed', async () => {
        const setIsMirrored = jest.fn();

        const mockedDeviceConfig = {
            config: { defaultValue: 'Off', options: ['Off', 'On'], type: 'selection' as const, value: 'Off' },
            name: 'Mirror camera',
            onChange: setIsMirrored,
        };

        renderApp({ deviceConfig: [mockedDeviceConfig] });
        await userEvent.click(screen.getByRole('button', { name: /Other camera settings/ }));

        await userEvent.click(screen.getByRole('button', { name: /Mirror camera selection/ }));
        await userEvent.selectOptions(screen.getByRole('listbox'), screen.getByRole('option', { name: 'On' }));
        expect(setIsMirrored).toHaveBeenCalledWith('On');
    });

    it('Check if resetting value set defaultValue', async () => {
        const setIsMirrored = jest.fn();

        const mockedDeviceConfig = {
            config: { defaultValue: 'Off', options: ['Off', 'On'], type: 'selection' as const, value: 'On' },
            name: 'Mirror camera',
            onChange: setIsMirrored,
        };

        renderApp({ deviceConfig: [mockedDeviceConfig] });
        await userEvent.click(screen.getByRole('button', { name: /Other camera settings/ }));

        await userEvent.click(screen.getByRole('button', { name: 'reset Mirror camera' }));
        expect(setIsMirrored).toHaveBeenCalledWith('Off');
    });

    it('Disables exposureTime and exposureCompensation when exposureMode is set to continuous', async () => {
        const mockedDeviceConfigOptions = [
            {
                name: 'exposureMode',
                config: {
                    type: 'selection' as const,
                    value: 'continuous',
                    defaultValue: 'continuous',
                    options: ['continuous', 'manual'],
                },
                onChange: jest.fn(),
            },
            {
                name: 'exposureTime',
                config: {
                    type: 'minMax' as const,
                    value: 312.5,
                    defaultValue: 312.5,
                    max: 5000,
                    min: 1.220703125,
                    step: 1.220703125,
                },
                onChange: jest.fn(),
            },
            {
                name: 'exposureCompensation',
                config: { type: 'minMax' as const, value: 31, defaultValue: 31, max: 100, min: 0, step: 1 },
                onChange: jest.fn(),
            },
        ];

        renderApp({ deviceConfig: mockedDeviceConfigOptions });
        await userEvent.click(screen.getByRole('button', { name: /Exposure settings/ }));
        expect(screen.getByText('Exposure mode')).toBeInTheDocument();
        expect(screen.queryByText('Exposure time')).not.toBeInTheDocument();
        expect(screen.queryByText('Exposure compensation')).not.toBeInTheDocument();
    });

    it('Enabled exposureTime and exposureCompensation when exposureMode is set to manual', async () => {
        const mockedDeviceConfigOptions = [
            {
                name: 'exposureMode',
                config: {
                    type: 'selection' as const,
                    value: 'manual',
                    defaultValue: 'continuous',
                    options: ['continuous', 'manual'],
                },
                onChange: jest.fn(),
            },
            {
                name: 'exposureTime',
                config: {
                    type: 'minMax' as const,
                    value: 312.5,
                    defaultValue: 312.5,
                    max: 5000,
                    min: 1.220703125,
                    step: 1.220703125,
                },
                onChange: jest.fn(),
            },
            {
                name: 'exposureCompensation',
                config: { type: 'minMax' as const, value: 31, defaultValue: 31, max: 100, min: 0, step: 1 },
                onChange: jest.fn(),
            },
        ];

        renderApp({ deviceConfig: mockedDeviceConfigOptions });
        await userEvent.click(screen.getByRole('button', { name: /Exposure settings/ }));
        expect(screen.getByText('Exposure mode')).toBeInTheDocument();
        expect(screen.getByText('Exposure time')).toBeInTheDocument();
        expect(screen.getByText('Exposure compensation')).toBeInTheDocument();
    });

    it('apply settings', async () => {
        const mockedOnChange = jest.fn();
        const mockedStream = {} as MediaStream;
        const mockedDeviceConfig = {
            name: 'frameRate',
            config: { type: 'minMax' as const, value: 0, defaultValue: 0, max: 30, min: 0 },
            onChange: mockedOnChange,
        };

        renderApp({ deviceConfig: [mockedDeviceConfig], stream: mockedStream });
        await userEvent.click(screen.getByRole('button', { name: /Camera movement settings/ }));
        fireEvent.keyDown(screen.getByRole('slider'), { key: 'Right' });

        expect(mockedOnChange).toHaveBeenCalledWith(`${mockedDeviceConfig.config.value + 1}`);
    });
});
