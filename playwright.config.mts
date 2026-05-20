import process from "node:process";
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  workers: 1,
  testDir: "tests",
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
  ],
  webServer: {
    command: "vp dev --config devtools/vite.config.ts --port 9000",
    reuseExistingServer: process.env.CI === undefined,
    stderr: "pipe",
    stdout: "pipe",
    url: "http://localhost:9000/",
  },
});
