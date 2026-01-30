
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    fullyParallel: false,
    retries: 0,
    workers: 1, // Serial execution to avoid DB race conditions on SQLite if robust locking isn't there
    reporter: 'line',
    use: {
        baseURL: 'http://localhost:3001',
        trace: 'on-first-retry',
        headless: true, // Run headless for speed, user just wants "browser operation" validated
        screenshot: 'only-on-failure',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
});
