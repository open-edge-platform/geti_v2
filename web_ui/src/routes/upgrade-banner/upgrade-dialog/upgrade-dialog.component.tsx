// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { useState } from 'react';

import { useCheckPlatformBackupQuery } from '@geti/core/src/platform-utils/hooks/use-platform-utils.hook';
import { PlatformVersion } from '@geti/core/src/platform-utils/services/utils.interface';
import {
    Button,
    ButtonGroup,
    Checkbox,
    Content,
    Dialog,
    DialogContainer,
    Divider,
    Flex,
    Heading,
    InlineAlert,
    Item,
    Picker,
    Text,
    View,
} from '@geti/ui';
import { Link } from 'react-router-dom';

import { useDocsUrl } from '../../../hooks/use-docs-url/use-docs-url.hook';

import styles from './upgrade-dialog.module.scss';

interface UpgradeDialogProps {
    isOpen: boolean;
    onClose: () => void;
    availableVersions: PlatformVersion[];
    currentVersion: string;
}

interface UpgradeDialogContentProps {
    availableVersions: PlatformVersion[];
    onClose: () => void;
    currentVersion: string;
}

const ReleaseNotes = ({ version }: { version: string }) => {
    const docsUrl = useDocsUrl();

    const releaseUrl = `${docsUrl}/docs/user-guide/release-notes/${version}/release-${version}`;

    return (
        <Text>
            Explore what is new in this version in the{' '}
            <Link to={releaseUrl} className={styles.releaseUrl}>
                release notes
            </Link>
            .
        </Text>
    );
};

const Version = ({ version }: { version: string }) => {
    return <Text UNSAFE_className={styles.version}>{version}</Text>;
};

const RequiredDrivers = ({ version }: { version: PlatformVersion }) => {
    return (
        <View>
            <Text>To proceed with the update, please ensure the following dependencies are installed:</Text>
            <ul className={styles.drivers}>
                <li>
                    k3s driver: <Version version={version.k3sVersion} />
                </li>
                <li>
                    Nvidia driver: <Version version={version.nvidiaDriversVersion} /> or Intel driver:{' '}
                    <Version version={version.intelDriversVersion} />
                </li>
            </ul>
        </View>
    );
};

interface SkipBackupAlertProps {
    isSkipBackupEnabled: boolean;
    onIsSkipBackupEnabled: (value: boolean) => void;
}

const SkipBackupAlert = ({ isSkipBackupEnabled, onIsSkipBackupEnabled }: SkipBackupAlertProps) => {
    return (
        <InlineAlert variant='notice'>
            <Heading>Insufficient disk space for backup</Heading>
            <Content>
                <Flex direction={'column'} gap={'size-100'}>
                    <Text>
                        To continue with the upgrade, you must confirm that you want to skip the backup due to limited
                        disk space.
                    </Text>
                    <Checkbox isEmphasized isSelected={isSkipBackupEnabled} onChange={onIsSkipBackupEnabled}>
                        Skip backup
                    </Checkbox>
                </Flex>
            </Content>
        </InlineAlert>
    );
};

interface UpgradeFormProps {
    availableVersions: PlatformVersion[];
    onClose: () => void;
    currentVersion: string;
}

const UpgradeForm = ({ availableVersions, onClose, currentVersion }: UpgradeFormProps) => {
    const { data: checkPlatformBackup } = useCheckPlatformBackupQuery();
    const isBackupPossible = checkPlatformBackup?.isBackupPossible ?? false;
    const [selectedVersionKey, setSelectedVersionKey] = useState(availableVersions[0].version);
    const selectedVersion = availableVersions.find(({ version }) => version === selectedVersionKey);
    const [isSkipBackupEnabled, setIsSkipBackupEnabled] = useState<boolean>(false);
    const shouldDisplayVersionsPicker = availableVersions.length > 1;

    const isUpgradeButtonDisabled = isBackupPossible ? false : !isSkipBackupEnabled;

    return (
        <>
            <Heading>
                <Flex alignItems={'baseline'} justifyContent={'space-between'}>
                    Update available
                    <Text UNSAFE_className={styles.currentVersion}>Current version: {currentVersion}</Text>
                </Flex>
            </Heading>
            <Divider />
            <Content>
                <Flex direction={'column'} gap={'size-100'}>
                    {selectedVersion !== undefined && (
                        <>
                            <Text>
                                Do you want to upgrade Geti to the version <Version version={selectedVersion.version} />
                                ?
                            </Text>
                            <RequiredDrivers version={selectedVersion} />
                            <ReleaseNotes version={selectedVersion.version} />
                        </>
                    )}
                    {!isBackupPossible && (
                        <SkipBackupAlert
                            isSkipBackupEnabled={isSkipBackupEnabled}
                            onIsSkipBackupEnabled={setIsSkipBackupEnabled}
                        />
                    )}
                </Flex>
            </Content>
            <ButtonGroup UNSAFE_className={styles.buttonGroup}>
                <Flex width={'100%'} justifyContent={'space-between'} alignItems={'end'}>
                    {shouldDisplayVersionsPicker && (
                        <Picker
                            label={'Version'}
                            justifySelf={'start'}
                            items={availableVersions}
                            selectedKey={selectedVersionKey}
                            onSelectionChange={(key) => setSelectedVersionKey(key as string)}
                        >
                            {({ version }) => <Item key={version}>{version}</Item>}
                        </Picker>
                    )}
                    <Flex marginStart={'auto'}>
                        <Button variant={'secondary'} onPress={onClose}>
                            Cancel
                        </Button>
                        <Button isDisabled={isUpgradeButtonDisabled}>Upgrade now</Button>
                    </Flex>
                </Flex>
            </ButtonGroup>
        </>
    );
};

const UpgradeDialogContent = ({ availableVersions, onClose, currentVersion }: UpgradeDialogContentProps) => {
    return (
        <Dialog>
            <UpgradeForm onClose={onClose} availableVersions={availableVersions} currentVersion={currentVersion} />
        </Dialog>
    );
};

export const UpgradeDialog = ({ isOpen, onClose, availableVersions, currentVersion }: UpgradeDialogProps) => {
    return (
        <DialogContainer onDismiss={onClose}>
            {isOpen && (
                <UpgradeDialogContent
                    availableVersions={availableVersions}
                    onClose={onClose}
                    currentVersion={currentVersion}
                />
            )}
        </DialogContainer>
    );
};
