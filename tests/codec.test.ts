import { expect, test } from "@playwright/test";

const codecs = [
  // 音声は Opus のみ
  // 映像は H.264/H.265 は Playwright ではサポートされていない
  {
    audioCodec: "audio/opus",
    videoCodec: "video/AV1",
  },
  {
    audioCodec: "audio/opus",
    videoCodec: "video/VP8",
  },
  {
    audioCodec: "audio/opus",
    videoCodec: "video/VP9",
  },
];

test.describe.parallel("コーデックテスト", () => {
  for (const { audioCodec, videoCodec } of codecs) {
    test(`${audioCodec} と ${videoCodec} で接続できる`, async ({ browser }) => {
      const sendrecv1 = await browser.newPage();
      const sendrecv2 = await browser.newPage();

      await sendrecv1.goto("http://localhost:9000/");
      await sendrecv2.goto("http://localhost:9000/");

      // RoodID を取得
      const roomId1 = await sendrecv1.evaluate(() => {
        const roomIdElement = document.querySelector('[data-testid="room-id"]')!;
        return roomIdElement.value;
      });
      const roomId2 = await sendrecv2.evaluate(() => {
        const roomIdElement = document.querySelector('[data-testid="room-id"]')!;
        return roomIdElement.value;
      });
      const roomIdSuffix = crypto.randomUUID();

      // RoomId を再設定
      await sendrecv1.fill('[data-testid="room-id"]', `${roomId1}-${roomIdSuffix}`);
      await sendrecv2.fill('[data-testid="room-id"]', `${roomId2}-${roomIdSuffix}`);

      // 音声コーデックを設定
      await sendrecv1.selectOption('[data-testid="audio-codec-mime-type"]', audioCodec);

      // 映像コーデックを設定
      await sendrecv1.selectOption('[data-testid="video-codec-mime-type"]', videoCodec);

      // ボタンが表示されるまで待つ
      await sendrecv1.waitForSelector('[data-testid="connect"]', {
        state: "visible",
      });
      await sendrecv2.waitForSelector('[data-testid="connect"]', {
        state: "visible",
      });

      await sendrecv1.click('[data-testid="connect"]');
      await sendrecv2.click('[data-testid="connect"]');

      // Data-connection-state が connected になるまで待つ
      await expect(sendrecv1.locator('[data-testid="connection-state"]')).toHaveAttribute(
        "data-connection-state",
        "connected",
        {
          timeout: 10_000,
        },
      );

      // もう一方のページも connected になるまで待つ
      await expect(sendrecv2.locator('[data-testid="connection-state"]')).toHaveAttribute(
        "data-connection-state",
        "connected",
        {
          timeout: 10_000,
        },
      );

      const hasNegotiatedVideoCodec = await sendrecv1.evaluate((expectedVideoCodec: string) => {
        const pc = globalThis.__ayameDevtoolsPeerConnection;
        if (!pc) {
          return false;
        }
        const videoSender = pc.getSenders().find((sender) => sender.track?.kind === "video");
        if (!videoSender) {
          return false;
        }
        const parameters = videoSender.getParameters();
        return (
          parameters.codecs?.some(
            (codec) => codec.mimeType.toLowerCase() === expectedVideoCodec.toLowerCase(),
          ) ?? false
        );
      }, videoCodec);
      expect(hasNegotiatedVideoCodec).toBe(true);

      await sendrecv1.click('[data-testid="disconnect"]');
      await sendrecv2.click('[data-testid="disconnect"]');

      await sendrecv1.close();
      await sendrecv2.close();
    });
  }
});
