import process from "node:process";
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  workers: 1,
  testDir: "tests",
  // FullyParallel: true,
  reporter: "html",
  use: {
    launchOptions: {
      args: [
        // CORS 無効
        "--disable-web-security",
        "--disable-features=IsolateOrigins,site-per-process",

        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
        // "--use-file-for-fake-video-capture=/app/sample.mjpeg",
      ],
    },
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },

    // {
    //   Name: 'firefox',
    //   Use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   Name: 'webkit',
    //   Use: { ...devices['Desktop Safari'] },
    // },
  ],
  webServer: {
    command: "pnpm run dev --port 9000",
    reuseExistingServer: process.env.CI === undefined,
    stderr: "pipe",
    stdout: "pipe",
    url: "http://localhost:9000/",
  },
});
