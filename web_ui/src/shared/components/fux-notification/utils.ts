// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { FUX_NOTIFICATION_KEYS } from '../../../core/user-settings/dtos/user-settings.interface';
import { DocsUrl } from '../tutorials/utils';

interface FuxNotificationData {
    header: string | undefined;
    description: string;
    docUrl: DocsUrl | undefined;
    nextStepId: FUX_NOTIFICATION_KEYS | undefined;
    previousStepId: FUX_NOTIFICATION_KEYS | undefined;
    showDismissAll: boolean;
}

export const getFuxNotificationData = (fuxNotificationId: string): FuxNotificationData => {
    switch (fuxNotificationId) {
        case FUX_NOTIFICATION_KEYS.ANNOTATE_INTERACTIVELY:
            return {
                header: '',
                description: 'Click here to start annotating your dataset.',
                docUrl: DocsUrl.ACTIVE_LEARNING,
                nextStepId: undefined,
                previousStepId: undefined,
                showDismissAll: false,
            };
        case FUX_NOTIFICATION_KEYS.ANNOTATOR_AUTO_TRAINING_STARTED:
            return {
                header: '',
                description:
                    `This auto-training job is scheduled and ready to start when resources are available.` +
                    ` Click the 'bell' icon to see the training progress.`,
                docUrl: undefined,
                nextStepId: undefined,
                previousStepId: undefined,
                showDismissAll: false,
            };
        case FUX_NOTIFICATION_KEYS.ANNOTATOR_TOOLS:
            return {
                header: 'How to annotate my data?',
                description:
                    `Effective data annotation lays the groundwork for a model’s ability to accurately interpret and` +
                    ` learn from information. By annotating your data, you teach the model what patterns to ` +
                    `recognize. Intel® Geti™ provides you with various smart annotation assistants to accelerate` +
                    ` this annotation process.`,
                docUrl: DocsUrl.ANNOTATION_TOOLS,
                nextStepId: FUX_NOTIFICATION_KEYS.ANNOTATOR_ACTIVE_SET,
                previousStepId: undefined,
                showDismissAll: true,
            };
        case FUX_NOTIFICATION_KEYS.ANNOTATOR_ACTIVE_SET:
            return {
                header: `What’s Active set?`,
                description:
                    `In the media gallery you can switch between Active set and Dataset. Active set is set by default` +
                    ` in Intel® Geti™ and it displays the media items in an order that is optimal for creating a ` +
                    `well-balanced model, based on their informative features compared to the rest of your dataset.` +
                    ` However, you can switch to Dataset to display the media items in the order that was arranged ` +
                    `in your dataset folder.`,
                docUrl: DocsUrl.MEDIA_GALLERY,
                nextStepId: undefined,
                previousStepId: FUX_NOTIFICATION_KEYS.ANNOTATOR_TOOLS,
                showDismissAll: true,
            };
        case FUX_NOTIFICATION_KEYS.ANNOTATOR_SUCCESSFULLY_TRAINED:
            return {
                header: 'Your model has been successfully trained',
                description: '',
                docUrl: DocsUrl.MODELS,
                nextStepId: FUX_NOTIFICATION_KEYS.ANNOTATOR_CHECK_PREDICTIONS,
                previousStepId: undefined,
                showDismissAll: true,
            };
        case FUX_NOTIFICATION_KEYS.ANNOTATOR_CHECK_PREDICTIONS:
            return {
                header: 'Check predictions',
                description:
                    `Click here to review the accuracy of your model by comparing the model’s predictions against` +
                    ` your original annotations. Use our tools to analyze and adjust the predictions as needed, so` +
                    ` they can be used during the next training rounds. This will help to further improve your ` +
                    `model's performance.`,
                docUrl: DocsUrl.TESTS,
                nextStepId: undefined,
                previousStepId: FUX_NOTIFICATION_KEYS.ANNOTATOR_SUCCESSFULLY_TRAINED,
                showDismissAll: true,
            };
        case FUX_NOTIFICATION_KEYS.ANNOTATOR_CONTINUE_ANNOTATING:
            return {
                header: 'Continue annotating',
                description: '',
                docUrl: DocsUrl.ANNOTATION_EDITOR,
                nextStepId: undefined,
                previousStepId: undefined,
                showDismissAll: true,
            };
        case FUX_NOTIFICATION_KEYS.CREDIT_BALANCE_BUTTON:
            return {
                header: '',
                description: '',
                docUrl: undefined,
                nextStepId: undefined,
                previousStepId: undefined,
                showDismissAll: false,
            };
        default:
            return {
                header: '',
                description: '',
                docUrl: undefined,
                previousStepId: undefined,
                nextStepId: undefined,
                showDismissAll: true,
            };
    }
};
