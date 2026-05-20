import { expect, test } from "@playwright/test";

test("切断後に再接続できる", async ({ browser }) => {
  const page1 = await browser.newPage();
  const page2 = await browser.newPage();

  await page1.goto("http://localhost:9000/");
  await page2.goto("http://localhost:9000/");

  const roomId1 = await page1.evaluate(() => {
    const el = document.querySelector('[data-testid="room-id"]') as HTMLInputElement;
    return el.value;
  });
  const roomId2 = await page2.evaluate(() => {
    const el = document.querySelector('[data-testid="room-id"]') as HTMLInputElement;
    return el.value;
  });
  const suffix = crypto.randomUUID();
  await page1.fill('[data-testid="room-id"]', `${roomId1}-${suffix}`);
  await page2.fill('[data-testid="room-id"]', `${roomId2}-${suffix}`);

  await page1.click('[data-testid="connect"]');
  await page2.click('[data-testid="connect"]');
  await expect(page1.locator('[data-testid="connection-state"]')).toHaveAttribute(
    "data-connection-state",
    "connected",
    { timeout: 10_000 },
  );
  await expect(page2.locator('[data-testid="connection-state"]')).toHaveAttribute(
    "data-connection-state",
    "connected",
    { timeout: 10_000 },
  );

  await page2.waitForFunction(
    () => {
      const video = document.querySelector('[data-testid="remote-video"]');
      if (!(video instanceof HTMLVideoElement)) {
        return false;
      }
      const stream = video.srcObject;
      return stream instanceof MediaStream && stream.getVideoTracks().length > 0;
    },
    { timeout: 10_000 },
  );

  await page1.click('[data-testid="disconnect"]');
  await page1.click('[data-testid="connect"]');
  await expect(page1.locator('[data-testid="connection-state"]')).toHaveAttribute(
    "data-connection-state",
    "connected",
    { timeout: 10_000 },
  );

  await page2.waitForFunction(
    () => {
      const video = document.querySelector('[data-testid="remote-video"]');
      if (!(video instanceof HTMLVideoElement)) {
        return false;
      }
      const stream = video.srcObject;
      return stream instanceof MediaStream && stream.getVideoTracks().length > 0;
    },
    { timeout: 10_000 },
  );

  await page1.click('[data-testid="disconnect"]');
  await page2.click('[data-testid="disconnect"]');
  await page1.close();
  await page2.close();
});
