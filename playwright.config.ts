import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], process.env.CI ? ["html", { open: "never" }] : ["html"]],
  use: {
    baseURL: "http://127.0.0.1:3210",
    trace: process.env.CI ? "on-first-retry" : "retain-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm dev --port 3210",
    reuseExistingServer: !process.env.CI,
    url: "http://127.0.0.1:3210",
    stdout: "pipe",
    stderr: "pipe",
  },
});

