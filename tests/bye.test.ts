import { expect, test } from "@playwright/test";

test("相手の切断後に再接続できる", async ({ browser }) => {
  const peer1 = await browser.newPage();
  const peer2 = await browser.newPage();

  await peer1.goto("http://localhost:9000/");
  await peer2.goto("http://localhost:9000/");

  const roomId1 = await peer1.evaluate(() => {
    const roomIdElement = document.querySelector('[data-testid="room-id"]')!;
    return (roomIdElement as HTMLInputElement).value;
  });
  const roomId2 = await peer2.evaluate(() => {
    const roomIdElement = document.querySelector('[data-testid="room-id"]')!;
    return (roomIdElement as HTMLInputElement).value;
  });
  const roomIdSuffix = crypto.randomUUID();

  await peer1.fill('[data-testid="room-id"]', `${roomId1}-${roomIdSuffix}`);
  await peer2.fill('[data-testid="room-id"]', `${roomId2}-${roomIdSuffix}`);

  await peer1.waitForSelector('[data-testid="connect"]', { state: "visible" });
  await peer2.waitForSelector('[data-testid="connect"]', { state: "visible" });

  await peer1.click('[data-testid="connect"]');
  await peer2.click('[data-testid="connect"]');

  await expect(peer1.locator('[data-testid="connection-state"]')).toHaveAttribute(
    "data-connection-state",
    "connected",
    { timeout: 10_000 },
  );
  await expect(peer2.locator('[data-testid="connection-state"]')).toHaveAttribute(
    "data-connection-state",
    "connected",
    { timeout: 10_000 },
  );

  // peer1 が切断すると peer2 には bye が届き、disconnect コールバックで接続状態が closed に戻る
  await peer1.click('[data-testid="disconnect"]');
  await expect(peer2.locator('[data-testid="connection-state"]')).not.toHaveAttribute(
    "data-connection-state",
    "connected",
    { timeout: 10_000 },
  );

  // bye で切断された側も、相手と一緒に再接続すれば restored できる
  await peer1.click('[data-testid="connect"]');
  await peer2.click('[data-testid="connect"]');
  await expect(peer1.locator('[data-testid="connection-state"]')).toHaveAttribute(
    "data-connection-state",
    "connected",
    { timeout: 10_000 },
  );
  await expect(peer2.locator('[data-testid="connection-state"]')).toHaveAttribute(
    "data-connection-state",
    "connected",
    { timeout: 10_000 },
  );

  await peer1.click('[data-testid="disconnect"]');
  await peer2.click('[data-testid="disconnect"]');

  await peer1.close();
  await peer2.close();
});
