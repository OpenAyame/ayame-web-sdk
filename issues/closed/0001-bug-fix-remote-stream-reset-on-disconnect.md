# disconnect 時に remoteStream をリセットする

- Priority: High
- Created: 2026-05-19
- Completed: 2026-05-20
- Model: Composer 2.5
- Branch: feature/fix-remote-stream-reset-on-disconnect

## 目的

同一 `Connection` インスタンスで `disconnect()` のあと `connect()` したとき、リモート `MediaStream` が届かず `addstream` コールバックが二度と発火しないバグを修正する。

## 優先度根拠

再接続は Ayame 利用の基本パターンである。症状はサイレント（エラーにならず映像だけ来ない）で、利用者が原因を特定しにくい。再接続時の映像消失はサポート問い合わせの増加に直結する。SDK コアの正しさに直結するため High とする。

## 現状

### 症状

1. `createConnection` → `connect(stream)` → リモート接続 → `addstream` 発火（初回は成功）
2. `disconnect()`
3. 同じ `Connection` で再度 `connect(stream)` → `addstream` が発火しない

### 原因（2 経路）

本バグは **2 つの独立した経路** で発生する。

**経路 1: `disconnect()` 経由（再接続時）**

`disconnect()` は `authzMetadata` / `isOffer` / `dataChannels` / `connectionState` を初期化するが、`remoteStream` をクリアしない（`src/ayame.ts:164-169`）。再 `connect()` で `createPeerConnection()` が呼ばれても、`ontrack` は既存の `remoteStream` を検知して何もしない。

**経路 2: glare 経由（再ネゴ時）**

glare 時、`have-local-offer` で再 `offer` を受信すると `disconnect()` を経由せずに `createPeerConnection()` を再呼び出す（`src/ayame.ts:259-262`）。このときも `remoteStream` がクリアされないため、再ネゴ後に `ontrack` が無視される。

### `ontrack` の挙動（共通）

```421:433:src/ayame.ts
    pc.ontrack = (event: RTCTrackEvent): void => {
      if (this.remoteStream) {
        return;
      }
      this.remoteStream = event.streams[0];
      const callbackEvent: AyameAddStreamEvent = {
        stream: this.remoteStream,
        type: "addstream",
      };
      this.callbacks.addstream(callbackEvent);
    };
```

`remoteStream` が null でない限り `ontrack` は早期リターンするため、両経路とも `remoteStream` のクリアが必須である。

### スコープ外（別 issue）

| 項目                                              | 扱い                                                                                                                 |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `event.streams[0]` が undefined のときの扱い      | 別途改善（`ontrack` の堅牢化）                                                                                       |
| 複数 `ontrack` / 複数 `MediaStream` のマージ      | 別途設計                                                                                                             |
| `this.stream`（ローカル）の `disconnect` 時クリア | 本 bug の直接原因ではない。`connect(stream)` が毎回 `this.stream` を上書きするため、再接続バグの修正には必須ではない |
| 旧 `RTCPeerConnection` の `close()` 漏れ          | issue 0005                                                                                                           |

## 設計方針

1. `Connection.disconnect()` の状態初期化ブロック（`src/ayame.ts:169` の後、170 行目の前）で `this.remoteStream = null` を追加する。経路 1（再接続時）の修正。`disconnect()` 経由の再接続では `closePeerConnection()` により `this.pc` が null になるため、設計方針 2 の条件は false となり、**このリセットのみが経路 1 を修正する**。
2. `createPeerConnection()` の **先頭**（`src/ayame.ts:325` の直後）で、既に `this.pc` が存在する場合は `this.remoteStream = null` にする。経路 2（glare 時の差し替え）の修正。`this.pc` の存在を条件にする理由は、**初回接続時は `remoteStream` が元々 null なのでクリア不要**、**差し替え時のみ旧値をクリアする** ためである。`ontrack` ハンドラ登録より前に行う。**このリセットは glare 経路専用であり、disconnect 経路では実行されない**。
3. 挙動変更は内部状態の修正のみ。公開 API のシグネチャは変えない（後方互換あり）。
4. 本修正では `callbacks.disconnect` は発火しない（0002 と独立）。

### 旧 PC と `ontrack` の競合について

`disconnect()` の `closePeerConnection()` は `this.pc` の `connectionState` が `closed` になるまでポーリングする（`src/ayame.ts:715-728`）。ポーリング中、旧 PC は `close()` 済みだが `this.pc` は残っている。この窓で旧 PC の `ontrack` が発火する可能性があるが、`close()` 済みの PC では `ontrack` は発火しないため問題ない。

glare 経路（設計方針 2）では、旧 PC のハンドラ解除と `close()` は **issue 0005 で対応する**。本 issue の `remoteStream` リセットは、旧 PC の `ontrack` が発火する前に実行されることが前提である。**0005 未適用時の glare では、旧 PC の `ontrack` が残り続けるため、本 issue 単独では glare 経路の完了条件を満たせない。0005 の適用が必須条件である。**

## 変更対象ファイル

| ファイル                                | 変更内容                                                                                     |
| --------------------------------------- | -------------------------------------------------------------------------------------------- |
| `src/ayame.ts`                          | `disconnect()` に `remoteStream` リセット。`createPeerConnection()` 先頭で差し替え時リセット |
| `CHANGES.md`                            | `## develop` に `[FIX]` エントリを追加                                                       |
| `tests/devtools.test.ts` または新規 E2E | 再接続シナリオ（下記テスト方針）                                                             |

## 完了条件

- [ ] 同一 `Connection` で disconnect → connect を繰り返しても、毎回 `addstream` が発火する
- [ ] glare 相当（`have-local-offer` 後の再 `offer`）のあとも、リモート映像が取得できる（**0005 マージ後に確認**。本 issue の設計方針 2 は glare 経路の `remoteStream` リセットを含むが、旧 PC のハンドラ解除と `close()` は 0005 で対応するため、0005 未適用時は glare 経路が完全に修正されない）
- [ ] 既存 E2E（`tests/devtools.test.ts`, `tests/codec.test.ts`）が通る
- [ ] `CHANGES.md` の `## develop` に本修正を `[FIX]` で記載済み

## テスト方針

AGENTS.md に従い、**モック・スタブは使用しない**。

### 推奨: Playwright E2E（DevTools 経由）

`tests/devtools.test.ts` にケースを追加する（または `tests/reconnect.test.ts` を新規作成）。

1. 2 タブで同一 room に connect → 双方 `data-connection-state=connected`
2. タブ 1 で disconnect
3. タブ 1 で再度 connect → タブ 2 側で remote video が再度表示される

検証アサーション（具体的に）:

- `page.waitForFunction` で `<video>` 要素の `srcObject` が `null` でなくなることを待つ（`RemoteVideo.tsx` には `data-testid` がないため、`video` タグで選択するか、テスト用に `data-testid="remote-video"` を追加する）
- または `page.evaluate` で `document.querySelector('video')?.srcObject?.getVideoTracks().length > 0` を検証
- 2 回目の connect 後も `data-connection-state` が `connected` になること

### 手動確認（E2E 環境が無い場合）

Ayame Labo 等で DevTools を 2 タブ開き、上記 1〜3 を実施。2 回目以降もリモート映像が表示されること。

## 解決方法

`src/ayame.ts` の `disconnect()` で `this.remoteStream = null` を追加した。`createPeerConnection()` の先頭で `this.pc` が存在する場合に `this.remoteStream = null` をリセットし、glare 時の PeerConnection 差し替え経路に対応した。`devtools/src/components/RemoteVideo.tsx` に `data-testid="remote-video"` を追加し、`tests/devtools.test.ts` に disconnect → connect の再接続 E2E を追加した。glare 経路の旧 PC ハンドラ解除は issue 0005 で対応予定。

## 解決方法（実装手順）

1. `src/ayame.ts` の `disconnect()`（行 169 の後、行 170 の前）に `this.remoteStream = null` を追加する。
2. `createPeerConnection()` の先頭（行 325 の直後、`this.traceLog` の前）に次を追加する。**初回接続時は `this.pc` が null なのでスキップされ、glare 時の差し替えのみ実行される**。

   ```ts
   if (this.pc) {
     this.remoteStream = null;
   }
   ```

3. `pnpm run build` 後、E2E または手動で完了条件を確認する。
4. `CHANGES.md` の `## develop` に次を追記する（セクション末尾、`[FIX]` は `[UPDATE]` の後）。
   - `- [FIX] disconnect 後の再接続で addstream が発火しない問題を修正する`
   - `  - @ユーザー名`（担当者行、2 文字インデント）

## 推奨着手順

AGENTS.md の issue 順に従い、SDK バグ fix の **最初** として本 issue を着手する。0002 と並行開発は可能だが、0002 のマージは本 issue の後にする（0002 の `bye` 処理は `disconnect()` を呼び、本 issue の `remoteStream` リセットに依存する）。0006 の再接続 E2E は本 issue マージ後。

## 関連 issue

| issue | 関係                                                                |
| ----- | ------------------------------------------------------------------- |
| 0002  | `bye` 時の切断（別経路）                                            |
| 0005  | glare 時の旧 PC `close()` 漏れ（本 issue では `remoteStream` のみ） |
| 0006  | 再接続 E2E の恒久化                                                 |
