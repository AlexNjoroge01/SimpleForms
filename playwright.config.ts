import { defineConfig, devices } from "@playwright/test"

const port = Number(process.env.PORT ?? 3000)
// PW_CHANNEL=msedge (or chrome) uses an installed browser instead of a downloaded one.
const channel = process.env.PW_CHANNEL

export default defineConfig({
  testDir: "./tests/e2e",
  globalTeardown: "./tests/e2e/global-teardown.ts",
  timeout: 90_000,
  expect: { timeout: 20_000 }, // dev server compiles routes on first hit
  use: { baseURL: `http://localhost:${port}`, trace: "on-first-retry" },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 7"], channel } },
    { name: "desktop", use: { ...devices["Desktop Chrome"], channel } },
  ],
  webServer: {
    command: `pnpm dev --port ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
