// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { expect, Page } from '@playwright/test';

export class CameraPage {
    constructor(private page: Page) {}

    async openCameraPage() {
        await this.page.getByRole('button', { name: /upload media/i }).click();
        await this.page.getByLabel('camera').click();
    }

    async openCameraPageAnomaly(bucket: string) {
        await this.page
            .getByTestId(`${bucket}-content-id`)
            .getByRole('button', { name: /upload media/i })
            .click();
        await this.page.getByLabel('camera').click();
    }

    async canTakePhotos() {
        await expect(this.page.getByRole('button', { name: 'photo capture' })).toBeEnabled();

        if (await this.page.getByLabel('Close toast', { exact: true }).isVisible()) {
            await this.page.getByLabel('Close toast', { exact: true }).click();
        }
    }

    async takeSinglePhoto() {
        await this.page.getByRole('button', { name: 'photo capture' }).click();
    }

    async viewAllCaptures() {
        await this.page.getByRole('link', { name: 'view all captures' }).click();
    }

    async discardAllPhotos() {
        // Trigger the confirmation dialog
        await this.page.getByRole('button', { name: 'Discard all', exact: true }).click();

        // Confirm
        await this.page.getByRole('alertdialog').getByRole('button', { name: 'Discard all' }).click();
    }

    async closeCameraPage() {
        await this.page.getByRole('button', { name: 'Cancel' }).click();
    }

    async deletePhoto() {
        const thumbnail = this.page.getByLabel(new RegExp(/media item \w+/));

        // Hover and click on the "trash" icon
        await thumbnail.hover();
        await this.page.getByRole('button', { name: 'delete', exact: true }).click();

        // Confirm deletion by pressing the "delete" button on the dialog
        await this.page.getByRole('button', { name: 'Delete', exact: true }).click();
    }
}
