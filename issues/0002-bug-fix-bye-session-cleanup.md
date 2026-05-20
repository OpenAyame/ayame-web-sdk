# bye 受信時にセッションを解放する

- Priority: High
- Created: 2026-05-19
- Model: Composer 2.5
- Branch: feature/fix-bye-session-cleanup

## 目的

シグナリングサーバから `type: "bye"` を受信したとき、WebSocket・RTCPeerConnection・DataChannel が解放されず、利用者の `disconnect` コールバックも発火しない問題を修正する。

## 優先度根拠

ピアの正常終了は通常運用で発生する。リソースが残り、UI が「接続中」のままになると利用者が切断を検知できない。SDK コアの正しさに直結するため High とする。

## 現状

### 症状

- 相手がルームを抜ける、または Ayame が `bye` を送る
- 自側では `on("bye")` のみ呼ばれ、`on("disconnect")` は呼ばれない
- `conn.peerConnection` / `conn.webSocket` が開いたまま残る

### 過去の修正との関係

CHANGES.md の `2020.2` リリースに `[FIX] bye を受信した場合にも on('disconnect') コールバックが発火するように修正する` が存在する。過去に修正済みの問題が再発しているが、原因（リファクタリングでの削除、仕様変更等）は不明である。本修正で再度対応し、二度と消えないようにする。

### 原因

`signaling()` 内の WebSocket `onmessage` で、`bye` 受信時に `callbacks.bye` と `signaling()` の `resolve()` のみ行い、セッション解放をしていない（`src/ayame.ts:234-237`）。

```234:237:src/ayame.ts
              } else if (message.type === "bye") {
                this.callbacks.bye(event);
                resolve();
                return;
```

### 補足（`signaling()` の Promise）

`accept` 受信時点で `signaling()` は既に `resolve()` 済み（`src/ayame.ts:250-251`）。`bye` はその後に届くため、`connect()` の await は既に解決している。本 issue では **`bye` 後のリソース解放と `disconnect` コールバック** が主目的である。

**注意**: `bye` が `accept` より先に到着する可能性がある。この場合、`disconnect()` は `pc` が null の状態で実行されるが、`ws` は `signaling()` 内で既に生成されているため null ではない。`closeWebSocketConnection()` で WS を閉じる処理が実行される。`resolve()` で signaling プロミスが解決するが、利用者は `open` / `connect` コールバックを受信していないまま `disconnect` コールバックを受信する。このケースでは利用者は `disconnect` コールバックの `reason` で `"BYE"` を判定できる。

### 補足（`disconnect()` はコールバックを呼ばない）

現状の `disconnect()`（`src/ayame.ts:155-170`）は DataChannel / PC / WS を閉じて内部状態を初期化するだけで、**`callbacks.disconnect` は一切呼ばない**。コールバック発火は ICE 失敗・`reject`・`setOffer` エラー等の各経路が個別に担っている。`bye` 修正では **`disconnect()` 実行後に明示的に `callbacks.disconnect` を呼ぶ** 必要がある。

## 設計方針

1. `message.type === "bye"` の分岐で、**`callbacks.bye` のあと** セッションを解放する。
2. `disconnect` コールバックを `reason: "BYE"` で 1 回発火する（既存の `AyameDisconnectEvent.reason` は `string`）。
3. `bye` コールバックは **後方互換のため残す**。JSDoc または型コメントで「ピア終了の通知。セッション解放は `disconnect` で行う」と明記する。
4. `onmessage` は同期ハンドラのため、`await this.disconnect()` は **`void this.disconnect().then(...)`** または同等の非同期 IIFE で呼ぶ（`onmessage` を `async` にしない）。
5. issue 0005 の idempotent 化前でも、`bye` 経路と ICE / WS 経路の二重 `disconnect` CB を避ける。0005 着手後は `disconnecting` フラグで統一する。

### 二重 `disconnect` コールバックの防止

`bye` 受信時に `disconnect()` を呼ぶと、内部で `closeWebSocketConnection()` が WS を閉じる。`closeWebSocketConnection()`（`src/ayame.ts:733-769`）は **`this.ws.onclose = null` を `this.ws.close()` の前に実行する**（行 749）。このため、WS クローズ時の `onclose` ハンドラ（`src/ayame.ts:189-197`）は発火せず、二重コールバックは起きない。

この安全性は `closeWebSocketConnection()` の実装詳細に依存している。将来このメソッドが変更された場合、二重コールバックが発生するリスクがある。0005 の `disconnecting` フラグ導入後はこの依存関係が解消される。

### `resolve()` と `disconnect()` の順序

実装イメージでは `void this.disconnect().then(...)` の完了を待たずに `resolve()` を呼ぶ。`signaling()` の Promise が解決した後も `disconnect()` は非同期で実行中である。これは意図通りであり、**`bye` 受信時に `signaling()` を即座に解決し、利用者の `connect()` await を解放する** ためである。`disconnect` コールバックは `disconnect()` 完了後に発火する。

**注意**: `connect()` の await が解決した時点でも `disconnect()` はまだ非同期実行中であり、`peerConnection` / `webSocket` が閉じ切っていない可能性がある。利用者が `connect()` 戻り直後にリソース状態を参照するコードを書いた場合、未解放のオブジェクトに触れるリスクがある。0005 の idempotent 化後はこの問題が解消される。

### `bye` コールバック内での利用者操作

`bye` コールバックは `disconnect()` の前に発火する。`bye` コールバック内で利用者が `disconnect()` を呼び出すと、二重 `disconnect()` が発生する。利用者は `bye` コールバック内で `disconnect()` を呼び出してはならない。この制約を JSDoc で明記する。

### 実装イメージ（`src/ayame.ts` の `bye` 分岐）

```ts
} else if (message.type === "bye") {
  this.callbacks.bye(event);
  void this.disconnect()
    .then(() => {
      this.callbacks.disconnect({ reason: "BYE" });
    })
    .catch(() => {
      // disconnect() が reject した場合でも callbacks.disconnect を発火させる
      // 現在の disconnect() は reject しないが、将来の変更に備える
      this.callbacks.disconnect({ reason: "BYE" });
    });
  resolve();
  return;
}
```

`disconnect()` が失敗した場合でも `callbacks.disconnect` を発火させるため、`.catch()` を追加する。`disconnect()` 内部の `closeDataChannel` / `closePeerConnection` / `closeWebSocketConnection` は現在 reject しない Promise 構造だが、将来の変更に備える。

`disconnect()` 完了後に issue 0001 の `remoteStream` リセットも行われる（0001 マージ後）。

## 変更対象ファイル

| ファイル       | 変更内容                                                 |
| -------------- | -------------------------------------------------------- |
| `src/ayame.ts` | `bye` 分岐で `disconnect()` と `disconnect` コールバック |
| `CHANGES.md`   | `## develop` に `[FIX]`                                  |
| `tests/`       | `bye` シナリオの E2E または手順書（0006 と連携可）       |

## 再現手順（手動）

1. DevTools またはサンプルを 2 クライアントで同一 room に connect
2. 一方で disconnect（または Ayame 側で相手に `bye` が送られる操作）
3. もう一方で `on("disconnect")` が呼ばれないこと、および DevTools の接続状態が残ることを確認（修正前）
4. 修正後は `on("disconnect")` が `reason` に `"BYE"` を含む形で 1 回発火し、PC/WS が閉じていること

## 完了条件

- [ ] `bye` 受信後、`peerConnection` と `webSocket` が閉じている（`readyState` / `connectionState` で確認可能）
- [ ] `on("disconnect")` が 1 回発火し、`reason` が `"BYE"` である
- [ ] `on("bye")` も従来どおり呼ばれる（後方互換）
- [ ] 上記をテストまたは issue 内手順で再現・確認できる
- [ ] `CHANGES.md` に `[FIX]` 記載済み
- [ ] issue 0001 がマージ済みであること（`disconnect()` 内の `remoteStream` リセットに依存）

## テスト方針

AGENTS.md: **モック・スタブ禁止**。

### 推奨: Playwright E2E

`tests/bye.test.ts`（新規）または `tests/devtools.test.ts` に追加。

1. 2 ページで connect
2. ページ 1 で disconnect
3. ページ 2 で `data-connection-state` が `connected` 以外になる、または disconnect 後に再 connect 可能になることを確認

実 Ayame シグナリングが必要。secrets 付き `e2e-test.yml` で実行する。

### 依存

issue 0006 で CI への組み込みを検討。本 issue 単体では手動 + ローカル E2E で可。

## 解決方法（実装手順）

1. `src/ayame.ts` の `bye` 分岐を「設計方針」の実装イメージどおり変更する。
2. `src/ayame.ts` の `AyameCallbacks` インターフェース（行 46-53）の `bye` コールバックに JSDoc を追加する:「ピア終了の通知。セッション解放は `disconnect` で行う。`bye` コールバック内で `disconnect()` を呼び出してはならない」
3. `pnpm run build` / lint / typecheck を実行する。
4. 手動または E2E（0006）で完了条件を確認する。
5. `CHANGES.md` の `## develop` に次を追記する（セクション末尾、`[FIX]` は `[ADD]` の後）。
   - `- [FIX] bye 受信時にセッションを解放し disconnect コールバックを発火する`
   - `  - @ユーザー名`（担当者行、2 文字インデント）

## 関連 issue

| issue | 関係                                            |
| ----- | ----------------------------------------------- |
| 0001  | `disconnect()` の状態リセット                   |
| 0005  | `disconnect` の idempotent 化・二重コールバック |
| 0006  | `bye` E2E の恒久化                              |

## スコープ外

- シグナリングプロトコル自体の変更
- `bye` 送信側（クライアントから peer に送る）の実装
