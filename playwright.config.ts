import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://127.0.0.1:4173/travelpilot-poc/',
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {},
  },
  projects: [320, 390, 430, 1024, 1440].map((width) => ({
    name: `width-${width}`,
    use: { viewport: { width, height: width < 700 ? 740 : 900 } },
  })),
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173/travelpilot-poc/',
    reuseExistingServer: !process.env.CI,
  },
})
