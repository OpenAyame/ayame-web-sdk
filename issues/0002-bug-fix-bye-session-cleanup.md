# bye 受信時にセッションを解放する

- Priority: High
- Created: 2026-05-19
- Model: Composer 2.5
- Branch: feature/fix-bye-session-cleanup

## 目的

シグナリングサーバから `type: "bye"` を受信したとき、WebSocket と RTCPeerConnection が残り続ける問題を修正する。

## 優先度根拠

ピア終了は通常運用で発生する。リソースリークと、利用者が切断を検知できない（`disconnect` コールバック未発火）ため High とする。

## 現状

`src/ayame.ts` の `signaling()` 内で `bye` 受信時は `callbacks.bye` と `resolve()` のみ実行し、`disconnect()` も `disconnect` コールバックも呼ばない。

```234:237:src/ayame.ts
              } else if (message.type === "bye") {
                this.callbacks.bye(event);
                resolve();
                return;
```

## 設計方針

- `bye` 受信時に `await this.disconnect()` で WS / PC / DataChannel を解放する
- `disconnect` コールバックを `reason: "BYE"`（または同等の定数）で発火する
- `bye` コールバックを残すか廃止するかは後方互換を考慮して決める（残す場合は「追加通知」であることを JSDoc に明記）

## 完了条件

- `bye` 受信後、`peerConnection` と `webSocket` が利用可能な状態で閉じられている
- `on("disconnect")` が 1 回発火する（二重発火しないことは別 issue で idempotent 化してもよい）
- 再現手順を issue またはテストに記載している

## 解決方法

- `message.type === "bye"` 分岐で `disconnect()` と `disconnect` コールバックを追加
- 手動確認または E2E でピア切断シナリオを検証する
