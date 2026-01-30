
import { test, expect } from '@playwright/test';

test('Debug Manual Entry Single', async ({ page }) => {
    test.setTimeout(60000);

    console.log("Navigating...");
    await page.goto('/login');
    // Login
    if (await page.isVisible('button:has-text("Development Login")')) {
        await page.click('button:has-text("Development Login")');
    } else {
        await page.click('text=Development Login');
        await page.waitForSelector('input[name="email"]');
        await page.fill('input[name="email"]', 's.o.02.0999@gmail.com');
        await page.click('button:has-text("Development Login")');
    }
    await page.waitForTimeout(2000);

    console.log("Starting Invoice Creation...");
    await page.goto('/invoices/new');

    // 1. Select Client
    const val = 'Manual Client 1';
    console.log(`Selecting Client: ${val}`);
    await page.click('input[placeholder="社名で検索..."]');
    await page.fill('input[placeholder="社名で検索..."]', val);
    await page.waitForSelector(`button:has-text("${val}")`, { timeout: 5000 });
    await page.locator(`button:has-text("${val}")`).first().click();

    // 2. Select Staff
    console.log("Selecting Staff...");
    // Try to find the select
    const select = page.locator('select').first();
    // Debug: print options
    // const options = await select.innerText();
    // console.log("Select options:", options);

    const options = await select.innerText();
    console.log("Staff Select Options Content:", options);

    // Try selecting by index
    await select.selectOption({ index: 1 });
    console.log("Staff Selected (Index 1).");

    // Close dropdowns
    await page.keyboard.press('Escape');
    await page.click('body', { position: { x: 0, y: 0 } });

    // 3. Title (REMOVED)
    // await page.fill('input[name="title"]', 'Debug Project 001');

    // 3. Fill Item Details (Required before Save)
    console.log("Filling Item Details...");
    // Use ID selector for robustness (escaping dots)
    // Or placeholder
    await page.fill('input[placeholder="〇〇様 PR動画"]', 'Debug Item Pkg');
    // Amount usually has no placeholder in Draft mode, use type="number"
    await page.locator('input[type="number"]').last().fill('100000');

    // 4. Save Draft
    console.log("Clicking Save Draft...");
    await page.click('button:has-text("保存")');

    // Check for success via Redirect or Toast
    try {
        // Validation error check
        await page.waitForSelector('.bg-red-500', { timeout: 3000 });
        console.log("ERROR ALERT FOUND!");
        const errText = await page.locator('.bg-red-500').innerText();
        console.log("Error Text:", errText);

        // Find fields with red ring
        const redFields = page.locator('.ring-red-500');
        const count = await redFields.count();
        console.log(`Found ${count} red fields.`);
        for (let i = 0; i < count; i++) {
            console.log(`Red Field ${i}:`, await redFields.nth(i).getAttribute('class'));
        }
        await page.screenshot({ path: 'debug-error.png', fullPage: true });
    } catch {
        console.log("No validation error found (Good).");
        // Check if redirected to list?
        // await page.waitForURL('**/invoices');
        console.log("Assuming Success.");
        await page.screenshot({ path: 'debug-success.png' });
    }
});
