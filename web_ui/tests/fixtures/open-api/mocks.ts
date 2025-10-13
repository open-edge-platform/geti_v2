// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import {
    FUX_NOTIFICATION_KEYS,
    FUX_SETTINGS_KEYS,
    GLOBAL_MODALS_KEYS,
    TUTORIAL_CARD_KEYS,
} from '../../../src/core/user-settings/dtos/user-settings.interface';

export const disabledFUXSettings = {
    homePageTutorial: {
        title: 'Home page tutorial',
        isEnabled: false,
        tooltipDescription: 'Toggle tutorial on the home page',
    },
    annotatorScreenTutorial: {
        title: 'Annotator tutorial',
        isEnabled: false,
        tooltipDescription: 'Toggle tutorial on annotator page',
    },
    [TUTORIAL_CARD_KEYS.CREATE_PROJECT_LABELS_SEGMENTATION]: {
        isEnabled: false,
    },
    [TUTORIAL_CARD_KEYS.CREATE_PROJECT_LABELS_DETECTION]: {
        isEnabled: false,
    },
    [TUTORIAL_CARD_KEYS.CREATE_PROJECT_LABELS_DETECTION_CHAIN]: {
        isEnabled: false,
    },
    [TUTORIAL_CARD_KEYS.CREATE_PROJECT_LABELS_CLASSIFICATION_HIERARCHICAL]: {
        isEnabled: false,
    },
    [TUTORIAL_CARD_KEYS.CREATE_PROJECT_LABELS_CLASSIFICATION_SINGLE_SELECTION]: {
        isEnabled: false,
    },
    [TUTORIAL_CARD_KEYS.CREATE_PROJECT_LABELS_CLASSIFICATION_MULTIPLE_SELECTION]: {
        isEnabled: false,
    },
    [TUTORIAL_CARD_KEYS.ANNOTATOR_DATASET_TUTORIAL]: {
        isEnabled: false,
    },
    [TUTORIAL_CARD_KEYS.PROJECT_DATASET_TUTORIAL]: {
        isEnabled: true,
    },
    [TUTORIAL_CARD_KEYS.PROJECT_MODEL_TUTORIAL]: {
        isEnabled: true,
    },
    [TUTORIAL_CARD_KEYS.PROJECT_TESTS_TUTORIAL]: {
        isEnabled: true,
    },
    [TUTORIAL_CARD_KEYS.PROJECT_DEPLOYMENT_TUTORIAL]: {
        isEnabled: true,
    },
    [TUTORIAL_CARD_KEYS.ANOMALY_TUTORIAL]: {
        isEnabled: false,
    },
    [TUTORIAL_CARD_KEYS.ANNOTATIONS_COUNT_LIMIT]: {
        isEnabled: true,
    },
    [GLOBAL_MODALS_KEYS.WELCOME_MODAL]: {
        isEnabled: false,
    },
    [GLOBAL_MODALS_KEYS.EXHAUSTED_ORGANIZATION_CREDITS_MODAL]: {
        isEnabled: false,
    },
    [FUX_NOTIFICATION_KEYS.ANNOTATE_INTERACTIVELY]: {
        isEnabled: false,
    },
    [FUX_NOTIFICATION_KEYS.ANNOTATOR_AUTO_TRAINING_STARTED]: {
        isEnabled: false,
    },
    [FUX_NOTIFICATION_KEYS.ANNOTATOR_ACTIVE_SET]: {
        isEnabled: false,
    },
    [FUX_NOTIFICATION_KEYS.ANNOTATOR_TOOLS]: {
        isEnabled: false,
    },
    [FUX_NOTIFICATION_KEYS.ANNOTATOR_SUCCESSFULLY_TRAINED]: {
        isEnabled: false,
    },
    [FUX_NOTIFICATION_KEYS.ANNOTATOR_CHECK_PREDICTIONS]: {
        isEnabled: false,
    },
    [FUX_NOTIFICATION_KEYS.ANNOTATOR_CONTINUE_ANNOTATING]: {
        isEnabled: false,
    },
    [FUX_NOTIFICATION_KEYS.AUTO_TRAINING_MODAL]: {
        isEnabled: false,
    },
    [FUX_NOTIFICATION_KEYS.AUTO_TRAINING_NOTIFICATION]: {
        isEnabled: false,
    },
    [FUX_SETTINGS_KEYS.NEVER_SUCCESSFULLY_AUTOTRAINED]: {
        value: false,
    },
    [FUX_SETTINGS_KEYS.USER_DISMISSED_ALL]: {
        value: false,
    },
    [FUX_SETTINGS_KEYS.NEVER_AUTOTRAINED]: {
        value: false,
    },
    [FUX_SETTINGS_KEYS.NEVER_ANNOTATED]: {
        value: false,
    },
    [FUX_SETTINGS_KEYS.NEVER_CHECKED_PREDICTIONS]: {
        value: false,
    },
    [FUX_SETTINGS_KEYS.FIRST_AUTOTRAINED_PROJECT_ID]: {
        value: null,
    },
    [FUX_SETTINGS_KEYS.FIRST_AUTOTRAINING_JOB_ID]: {
        value: null,
    },
};

export const settings = JSON.stringify(disabledFUXSettings);
