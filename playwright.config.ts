import { defineConfig, devices } from '@playwright/test';

const PORT = 4178;
const baseURL = `http://127.0.0.1:${String(PORT)}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: process.env.CI === 'true',
  retries: process.env.CI === 'true' ? 1 : 0,
  reporter: process.env.CI === 'true' ? [['github'], ['list']] : [['list']],
  use: { baseURL, trace: 'on-first-retry' },

  // The same build that ships, not the dev server.
  webServer: {
    command: `npm run build && npx vite preview --host 127.0.0.1 --port ${String(PORT)} --strictPort`,
    url: baseURL,
    reuseExistingServer: process.env.CI !== 'true',
    timeout: 180_000,
  },

  projects: [
    { name: 'phone', use: { ...devices['Pixel 7'] } },
    {
      // An iPad-sized viewport on Chromium, so CI installs one browser.
      name: 'tablet',
      use: { ...devices['Desktop Chrome'], viewport: { width: 834, height: 1112 } },
    },
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 860 } },
    },
  ],
});
