import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests", timeout: 30000, workers: 1,
  use: { baseURL: "http://127.0.0.1:5175", headless: true, launchOptions: { executablePath: process.env.QA_CHROME_PATH } },
  webServer: { command: "python -m http.server 5175 --bind 127.0.0.1 --directory ..", url: "http://127.0.0.1:5175/static/adminapp/", reuseExistingServer: true },
});

