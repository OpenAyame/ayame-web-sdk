import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

// リモート映像の video 要素に映像トラックが 1 つ以上届くまで待つ。
// waitForFunction の第 2 引数は pageFunction に渡す arg であり、
// タイムアウトなどの options は第 3 引数に渡さないと適用されない。
const waitForRemoteVideoTrack = async (page: Page): Promise<void> => {
  await page.waitForFunction(
    () => {
      const video = document.querySelector('[data-testid="remote-video"]');
      if (!(video instanceof HTMLVideoElement)) {
        return false;
      }
      const stream = video.srcObject;
      return stream instanceof MediaStream && stream.getVideoTracks().length > 0;
    },
    null,
    { timeout: 10_000 },
  );
};

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

  // 初回接続: 双方 connected になり、page2 に映像トラックが届くこと
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
  await waitForRemoteVideoTrack(page2);

  // page1 を切断すると自分の接続状態は closed に戻る
  await page1.click('[data-testid="disconnect"]');
  await expect(page1.locator('[data-testid="connection-state"]')).not.toHaveAttribute(
    "data-connection-state",
    "connected",
    { timeout: 10_000 },
  );

  // page2 には bye が届き、接続状態が closed になる（bye テストと同じ前提）
  await expect(page2.locator('[data-testid="connection-state"]')).not.toHaveAttribute(
    "data-connection-state",
    "connected",
    { timeout: 10_000 },
  );

  // 双方を再接続: 2 回目の connect でも connected になり、
  // 再ネゴシエーションで双方に映像トラックが再配信されること（0001 の検証対象）
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
  await waitForRemoteVideoTrack(page2);
  await waitForRemoteVideoTrack(page1);

  await page1.click('[data-testid="disconnect"]');
  await page2.click('[data-testid="disconnect"]');
  await page1.close();
  await page2.close();
});
