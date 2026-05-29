import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  webServer: [
    {
      command: 'npm run dev',
      cwd: '../Backend',
      env: {
        PORT: '5001',
        CORS_ORIGINS: 'http://localhost:5173,http://127.0.0.1:5173',
        MOCK_PROVIDERS: 'true',
      },
      url: 'http://localhost:5001/api/health',
      reuseExistingServer: true,
      timeout: 20_000,
    },
    {
      command: 'npm run dev -- --port 5173',
      env: {
        VITE_API_BASE_URL: 'http://localhost:5001/api',
        VITE_WS_BASE_URL: 'ws://localhost:5001/ws/simulation',
      },
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 20_000,
    },
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
