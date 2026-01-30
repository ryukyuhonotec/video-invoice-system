
import { test, expect } from '@playwright/test';

test.describe('Debug Manual Invoice', () => {
    test.setTimeout(60000);

    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        const emailInput = page.locator('input[name="email"]');
        if (await emailInput.count() > 0) {
            await emailInput.fill('s.o.02.0999@gmail.com');
            await page.click('button:has-text("Development Login")');
        } else {
            if (await page.isVisible('button:has-text("Development Login")')) {
                await page.click('button:has-text("Development Login")');
            } else {
                await page.click('text=Development Login');
                await page.waitForSelector('input[name="email"]');
                await page.fill('input[name="email"]', 's.o.02.0999@gmail.com');
                await page.click('button:has-text("Development Login")');
            }
        }
    });

    test('Create 1 Invoice Debug', async ({ page }) => {
        await page.goto('/invoices/new');

        // Debug Client Selection
        console.log('Focusing Input...');
        await page.click('input[placeholder="社名で検索..."]');
        await page.fill('input[placeholder="社名で検索..."]', 'Manual Client 1');

        console.log('Waiting for dropdown...');
        const dropdown = page.locator('div.absolute').filter({ hasText: 'Manual Client 1' });
        await dropdown.waitFor({ state: 'visible', timeout: 5000 });

        console.log('Clicking option...');
        // Find the button inside that contains the text
        await page.locator('button').filter({ hasText: 'Manual Client 1' }).first().click();

        await page.fill('input[name="title"]', 'Debug Project');

        console.log('Saving Draft...');
        await page.click('button:has-text("下書き保存")');

        // Check for success via URL change or Toast
        await page.waitForURL(/\/invoices\/.+/, { timeout: 10000 });
        console.log('Invoice Created!');
    });
});
