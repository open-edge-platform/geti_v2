// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { Page } from '@playwright/test';

export class QuickInferencePage {
    constructor(private page: Page) {}

    async uploadImage(file: string) {
        let element = null;

        if (await this.page.getByTestId('modal').getByRole('button', { name: 'Upload file' }).isVisible()) {
            element = this.page.getByTestId('modal').getByRole('button', { name: 'Upload file' });
        } else {
            element = this.page.getByRole('button', { name: 'Upload file' });
        }

        const [fileChooser] = await Promise.all([
            // It is important to call waitForEvent before click to set up waiting.
            this.page.waitForEvent('filechooser'),
            element.click(),
        ]);

        await fileChooser.setFiles([file]);
    }

    getAlertMessage() {
        return this.page.getByRole('tabpanel', { name: 'Live prediction' }).getByRole('alert');
    }

    getAlertMessageInFullScreen() {
        return this.page.getByTestId('modal').getByRole('alert');
    }

    async openFullscreen() {
        await this.page.getByRole('button', { name: /open in fullscreen/i }).click();
    }

    async closeFullscreen() {
        await this.page.getByRole('button', { name: /close fullscreen/i }).click();
    }

    async toggleExplanation() {
        await this.page.getByRole('switch').click();
    }

    async takePhoto() {
        await this.page.getByRole('button', { name: 'photo capture' }).click();
    }

    async takeNext() {
        await this.page.getByRole('button', { name: 'Take next shot' }).click();
    }

    getExplanationImage() {
        return this.page.getByTestId('explanation-image');
    }

    async useCameraInference() {
        await this.page.getByRole('button', { name: /use camera/i }).click();
    }
}
