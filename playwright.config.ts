import { defineConfig, devices } from "@playwright/test";

if (!process.env.E2E_DATABASE_URL) {
  throw new Error("Set E2E_DATABASE_URL to a dedicated PostgreSQL test database.");
}

// Override any development database loaded from .env, in both tests and Next.js.
process.env.DATABASE_URL = process.env.E2E_DATABASE_URL;

const baseURL = "http://127.0.0.1:3100";

export default defineConfig({
  testDir: "./e2e",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    serviceWorkers: "block",
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command:
      "npm run db:generate && npm run db:push && npm run build && npm run start -- --hostname 127.0.0.1 --port 3100",
    url: `${baseURL}/auth/signup`,
    reuseExistingServer: false,
    timeout: 240_000,
    env: {
      DATABASE_URL: process.env.E2E_DATABASE_URL,
      NEXTAUTH_URL: baseURL,
      NEXTAUTH_SECRET: "unwhelm-e2e-only-secret",
    },
  },
});
