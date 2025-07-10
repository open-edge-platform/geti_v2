// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { createInMemoryPlatformUtilsService } from '@geti/core/src/platform-utils/services/create-in-memory-platform-utils-service';
import { fireEvent, screen, waitFor } from '@testing-library/react';

import { getMockedPlatformVersion } from '../../../test-utils/mocked-items-factory/mocked-platform-utils';
import { providersRender as render } from '../../../test-utils/required-providers-render';
import { UpgradeDialog } from './upgrade-dialog.component';

describe('UpgradeDialog', () => {
    const currentVersion = '2.11.0';

    it('displays current version, required drivers versions and release notes link', () => {
        const availableVersions = [
            getMockedPlatformVersion({
                version: '2.12.0',
                k3sVersion: '1.0.0',
                intelDriversVersion: '2.0.0',
                nvidiaDriversVersion: '3.0.0',
            }),
        ];

        render(
            <UpgradeDialog
                isOpen
                onClose={jest.fn()}
                availableVersions={availableVersions}
                currentVersion={currentVersion}
            />
        );

        expect(screen.getByText(`Current version: ${currentVersion}`)).toBeInTheDocument();
        expect(screen.getByTestId('newer-version')).toHaveTextContent(availableVersions[0].version);
        expect(screen.getByTestId('k3s-driver-version')).toHaveTextContent(availableVersions[0].k3sVersion);
        expect(screen.getByTestId('intel-driver-version')).toHaveTextContent(availableVersions[0].intelDriversVersion);
        expect(screen.getByTestId('nvidia-driver-version')).toHaveTextContent(
            availableVersions[0].nvidiaDriversVersion
        );
        expect(screen.getByRole('link', { name: /release notes/i })).toHaveAttribute(
            'href',
            expect.stringContaining(availableVersions[0].version)
        );
    });

    it('does not display versions picker when only one version is available', () => {
        const availableVersions = [
            getMockedPlatformVersion({
                version: '2.12.0',
                k3sVersion: '1.0.0',
                intelDriversVersion: '2.0.0',
                nvidiaDriversVersion: '3.0.0',
            }),
        ];

        render(
            <UpgradeDialog
                isOpen
                onClose={jest.fn()}
                availableVersions={availableVersions}
                currentVersion={currentVersion}
            />
        );

        expect(screen.queryByRole('button', { name: /version/i })).not.toBeInTheDocument();
    });

    it('displays versions picker when multiple versions are available', () => {
        const availableVersions = [
            getMockedPlatformVersion({
                version: '2.12.0',
                k3sVersion: '1.0.0',
                intelDriversVersion: '2.0.0',
                nvidiaDriversVersion: '3.0.0',
            }),
            getMockedPlatformVersion({
                version: '2.13.0',
                k3sVersion: '1.1.0',
                intelDriversVersion: '2.1.0',
                nvidiaDriversVersion: '3.1.0',
            }),
        ];

        render(
            <UpgradeDialog
                isOpen
                onClose={jest.fn()}
                availableVersions={availableVersions}
                currentVersion={currentVersion}
            />
        );

        expect(screen.getByRole('button', { name: /version/i })).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /version/i }));

        availableVersions.forEach((version) => {
            expect(screen.getByRole('option', { name: version.version })).toBeInTheDocument();
        });
    });

    it('updates drivers versions, release notes link and sends correct payload to upgrade when version changes', async () => {
        const availableVersions = [
            getMockedPlatformVersion({
                version: '2.12.0',
                k3sVersion: '1.0.0',
                intelDriversVersion: '2.0.0',
                nvidiaDriversVersion: '3.0.0',
            }),
            getMockedPlatformVersion({
                version: '2.13.0',
                k3sVersion: '1.1.0',
                intelDriversVersion: '2.1.0',
                nvidiaDriversVersion: '3.1.0',
            }),
        ];

        const mockUpgradePlatform = jest.fn();

        const platformUtilsService = createInMemoryPlatformUtilsService();
        platformUtilsService.upgradePlatform = mockUpgradePlatform;

        render(
            <UpgradeDialog
                isOpen
                onClose={jest.fn()}
                availableVersions={availableVersions}
                currentVersion={currentVersion}
            />,
            {
                services: {
                    platformUtilsService,
                },
            }
        );

        expect(screen.getByTestId('newer-version')).toHaveTextContent(availableVersions[0].version);
        expect(screen.getByTestId('k3s-driver-version')).toHaveTextContent(availableVersions[0].k3sVersion);
        expect(screen.getByTestId('intel-driver-version')).toHaveTextContent(availableVersions[0].intelDriversVersion);
        expect(screen.getByTestId('nvidia-driver-version')).toHaveTextContent(
            availableVersions[0].nvidiaDriversVersion
        );
        expect(screen.getByRole('link', { name: /release notes/i })).toHaveAttribute(
            'href',
            expect.stringContaining(availableVersions[0].version)
        );

        fireEvent.click(screen.getByRole('button', { name: /version/i }));
        fireEvent.click(screen.getByRole('option', { name: availableVersions[1].version }));

        expect(screen.getByTestId('newer-version')).toHaveTextContent(availableVersions[1].version);
        expect(screen.getByTestId('k3s-driver-version')).toHaveTextContent(availableVersions[1].k3sVersion);
        expect(screen.getByTestId('intel-driver-version')).toHaveTextContent(availableVersions[1].intelDriversVersion);
        expect(screen.getByTestId('nvidia-driver-version')).toHaveTextContent(
            availableVersions[1].nvidiaDriversVersion
        );
        expect(screen.getByRole('link', { name: /release notes/i })).toHaveAttribute(
            'href',
            expect.stringContaining(availableVersions[1].version)
        );

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /upgrade now/i })).toBeEnabled();
        });

        fireEvent.click(screen.getByRole('button', { name: /upgrade now/i }));

        await waitFor(() => {
            expect(mockUpgradePlatform).toHaveBeenCalledWith({
                version: availableVersions[1].version,
                forceUpgrade: undefined,
            });
        });
    });

    it('displays alert that backup is not possible', async () => {
        const availableVersions = [
            getMockedPlatformVersion({
                version: '2.12.0',
                k3sVersion: '1.0.0',
                intelDriversVersion: '2.0.0',
                nvidiaDriversVersion: '3.0.0',
            }),
        ];

        const platformUtilsService = createInMemoryPlatformUtilsService();
        platformUtilsService.checkPlatformBackup = jest.fn(async () => ({
            isBackupPossible: false,
        }));

        render(
            <UpgradeDialog
                isOpen
                onClose={jest.fn()}
                availableVersions={availableVersions}
                currentVersion={currentVersion}
            />,
            {
                services: {
                    platformUtilsService,
                },
            }
        );

        expect(
            await screen.findByText(
                'To continue with the update, you must confirm that you want to skip the backup due to limited disk space.'
            )
        ).toBeInTheDocument();
        expect(screen.getByRole('checkbox', { name: /skip backup/i })).toBeInTheDocument();
    });

    it('disables upgrade button when backup is not possible and skip token is not checked', async () => {
        const availableVersions = [
            getMockedPlatformVersion({
                version: '2.12.0',
                k3sVersion: '1.0.0',
                intelDriversVersion: '2.0.0',
                nvidiaDriversVersion: '3.0.0',
            }),
        ];

        const platformUtilsService = createInMemoryPlatformUtilsService();
        platformUtilsService.checkPlatformBackup = jest.fn(async () => ({
            isBackupPossible: false,
        }));

        render(
            <UpgradeDialog
                isOpen
                onClose={jest.fn()}
                availableVersions={availableVersions}
                currentVersion={currentVersion}
            />,
            {
                services: {
                    platformUtilsService,
                },
            }
        );

        expect(await screen.findByRole('checkbox', { name: /skip backup/i })).not.toBeChecked();
        expect(screen.getByRole('button', { name: /upgrade now/i })).toBeDisabled();
    });

    it('enables upgrade button when backup is not possible and skip token is checked', async () => {
        const availableVersions = [
            getMockedPlatformVersion({
                version: '2.12.0',
                k3sVersion: '1.0.0',
                intelDriversVersion: '2.0.0',
                nvidiaDriversVersion: '3.0.0',
            }),
        ];

        const platformUtilsService = createInMemoryPlatformUtilsService();
        platformUtilsService.checkPlatformBackup = jest.fn(async () => ({
            isBackupPossible: false,
        }));

        render(
            <UpgradeDialog
                isOpen
                onClose={jest.fn()}
                availableVersions={availableVersions}
                currentVersion={currentVersion}
            />,
            {
                services: {
                    platformUtilsService,
                },
            }
        );

        fireEvent.click(await screen.findByRole('checkbox', { name: /skip backup/i }));
        expect(screen.getByRole('checkbox', { name: /skip backup/i })).toBeChecked();
        expect(screen.getByRole('button', { name: /upgrade now/i })).toBeEnabled();
    });
});
