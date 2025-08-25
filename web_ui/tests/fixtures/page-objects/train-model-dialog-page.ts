// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { Page } from '@playwright/test';

import { ModelConfigurationOption } from '../../../src/pages/project-details/components/project-models/legacy-train-model-dialog/model-templates-selection/utils';

export class TrainModelDialogPage {
    constructor(private page: Page) {}

    async selectModelTemplate(modelTemplate: string) {
        await this.page.getByRole('radio', { name: modelTemplate }).check();
    }

    async advancedSettings() {
        await this.page.getByRole('button', { name: /advanced settings/i }).click();
    }

    async changeSubsetRange(range: 'start' | 'end', iterations: number) {
        await this.page.getByLabel(range === 'start' ? 'Start range' : 'End range').click();

        for (let i = 0; i < iterations; i++) {
            await this.page.keyboard.press('ArrowLeft');
        }
    }

    getNumberParameter(parameterName: string) {
        return this.page.getByRole('textbox', { name: `Change ${parameterName}` });
    }

    async changeNumberParameter(parameterName: string, value: number) {
        await this.getNumberParameter(parameterName).fill(value.toString());
    }

    getBooleanParameter(parameterName: string) {
        return this.page.getByRole('switch', { name: `Toggle ${parameterName}` });
    }

    async toggleEnableParameter(parameterName: string) {
        await this.getBooleanParameter(parameterName).click();
    }

    getToggleFilter(parameterName: string) {
        return this.page.getByRole('checkbox', { name: `Toggle ${parameterName}` });
    }

    async toggleFilter(parameterName: string) {
        await this.getToggleFilter(parameterName).click();
    }

    async resetParameterToDefault(parameterName: string) {
        await this.page.getByRole('button', { name: `Reset ${parameterName}` }).click();
    }

    getFineTuneParameter(parameterName: string) {
        return this.page.getByRole('radio', { name: new RegExp(parameterName, 'i') });
    }

    getReshuffleSubsets() {
        return this.page.getByRole('checkbox', { name: 'Reshuffle subsets' });
    }

    async toggleReshuffleSubsets() {
        await this.getReshuffleSubsets().click();
    }

    async selectFineTuneParameter(parameterName: string) {
        await this.getFineTuneParameter(parameterName).click();
    }

    getTag(tagName: string) {
        return this.page.getByLabel(tagName);
    }

    async selectTab(name: 'Architecture' | 'Data management' | 'Training') {
        await this.page.getByRole('tab', { name }).click();
    }

    async selectModelConfigurationOption(option: ModelConfigurationOption) {
        await this.page.getByRole('radio', { name: option }).check();
    }

    async selectModelAlgorithm(name: string) {
        await this.page.getByRole('radio', { name, exact: true }).check();
    }

    async nextStep() {
        await this.page.getByRole('button', { name: /Next/i }).click();
    }

    async previousStep() {
        await this.page.getByTestId('modal').getByRole('button', { name: /Back/i }).click();
    }

    async train() {
        // For SaaS, where we use the credit system, the button to start training includes the
        // amount of credits that will be consumed by the training
        const trainButton = this.page
            .getByRole('button', { name: /start/i })
            .or(this.page.getByRole('button', { name: /credits to consume/i }));

        await trainButton.click();
    }

    async selectTaskType(taskType: string) {
        await this.page.getByRole('button', { name: /select domain task/i }).click();

        await this.page.getByRole('option', { name: new RegExp(taskType, 'i'), exact: false }).click();
    }
}
