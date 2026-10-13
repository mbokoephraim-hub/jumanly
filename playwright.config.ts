import { defineConfig, devices } from "@playwright/test";
import { OUTBOX_FILE } from "./tests/e2e/outbox";

const port = 3100;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "on-first-retry",
    // Permet d'utiliser un Chromium déjà installé (ex. PLAYWRIGHT_CHROMIUM=/opt/pw-browsers/chromium).
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM }
      : undefined,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  // Les tests tournent sur la version de production (pnpm build au préalable).
  webServer: {
    command: `pnpm start --port ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      BETTER_AUTH_URL: `http://localhost:${port}`,
      BETTER_AUTH_SECRET:
        process.env.BETTER_AUTH_SECRET || "secret-de-test-e2e-uniquement-0123456789abcdef",
      EMAIL_OUTBOX_FILE: OUTBOX_FILE,
      // Les tests créent beaucoup de comptes depuis la même machine.
      AUTH_RATE_LIMIT: "off",
    },
  },
});
