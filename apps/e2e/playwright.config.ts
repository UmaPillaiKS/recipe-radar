import { defineConfig } from "@playwright/test";

const WEB_URL = process.env.WEB_URL || "http://localhost:5173";
const API_URL = process.env.API_URL || "http://localhost:4000";

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: WEB_URL,
    trace: "on-first-retry",
  },
  reporter: [["html", { open: "never" }], ["list"]],
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
  ],
  // expose API_URL to tests via env (we’ll read process.env.API_URL)
});
