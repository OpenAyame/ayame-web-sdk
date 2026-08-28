# シグナリングと WebRTC のエラーパスを整備する

- Priority: Medium
- Created: 2026-05-19
- Completed: 2026-05-20
- Model: Composer 2.5
- Branch: feature/fix-signaling-webrtc-error-paths

## 目的

`src/ayame.ts` のシグナリングと WebRTC 処理において、未処理の Promise rejection、リソースリーク、サイレント失敗、オプション無視が起きないようにする。

## 優先度根拠

happy path では再現しにくいが、再ネゴ・ICE 順序ずれ・一時的な `disconnected` で接続不能やリークにつながる。0001 / 0002 とは独立した品質改善のため Medium とする。**0001 / 0002 完了後**に着手することを推奨する。

## 前提・関連 issue

| issue | 関係                                                                  |
| ----- | --------------------------------------------------------------------- |
| 0001  | `remoteStream` リセット。glare 時の差し替えでも 0001 と重なる箇所あり |
| 0002  | `bye` 時の `disconnect`。本 issue の idempotent 化と整合が必要        |
| 0006  | 異常系の回帰テスト                                                    |

## 現状と対応方針（項目別）

以下を **1 項目ずつ** 修正可能な粒度とする。AGENTS.md に従い、1 issue 完了ごとに 1 コミットとする。

### A. `setAnswer` の例外未処理

| 項目 | 内容                                                                                                                  |
| ---- | --------------------------------------------------------------------------------------------------------------------- |
| 場所 | `src/ayame.ts:270-275`, `610-616`                                                                                     |
| 問題 | `void this.setAnswer(...)`。`setOffer`（618-632）には try/catch がある                                                |
| 対応 | `setOffer` と同様に try/catch → `disconnect("SET-ANSWER-ERROR", error)`。コールバック発火は `disconnect()` 内部で行う |

### A2. `sendOffer` の例外未処理

| 項目 | 内容                                                                                                                   |
| ---- | ---------------------------------------------------------------------------------------------------------------------- |
| 場所 | `src/ayame.ts:571-588`                                                                                                 |
| 問題 | `sendOffer` に try/catch がない。`createOffer` / `setLocalDescription` 失敗時に unhandled rejection になる             |
| 対応 | `setAnswer` と同様に try/catch → `disconnect("SEND-OFFER-ERROR", error)`。コールバック発火は `disconnect()` 内部で行う |

### B. glare 時の旧 PC 未 close

| 項目 | 内容                                                                                      |
| ---- | ----------------------------------------------------------------------------------------- |
| 場所 | `src/ayame.ts:259-262`, `484-491`                                                         |
| 問題 | `createPeerConnection()` で `this.pc` を上書きするのみ                                    |
| 対応 | 差し替え前に旧 PC のハンドラ解除と `close()`。0001 の `remoteStream` リセットと同時に確認 |

### C. ICE candidate キューなし

| 項目 | 内容                                                                                  |
| ---- | ------------------------------------------------------------------------------------- |
| 場所 | `src/ayame.ts:276-280`, `635-642`                                                     |
| 問題 | `addIceCandidate` 失敗を空 `catch` で握り潰し                                         |
| 対応 | `remoteDescription` 設定前は配列にキューし、設定後にフラッシュ。恒久失敗は `traceLog` |

### D. ICE `disconnected` の即切断

| 項目    | 内容                                                                                                           |
| ------- | -------------------------------------------------------------------------------------------------------------- |
| 場所    | `src/ayame.ts:452-458`                                                                                         |
| 問題    | `disconnected` と `failed` を同じ扱い                                                                          |
| 対応    | `failed` のみ切断する。`disconnected` では切断しない。`reason` を `ICE-DISCONNECTED` / `ICE-FAILED` で分離する |
| CHANGES | 挙動変更のため `[CHANGE]` とする                                                                               |

### E. `disconnect()` の二重呼び出し・コールバック重複

| 項目 | 内容                                                                                   |
| ---- | -------------------------------------------------------------------------------------- |
| 場所 | `189-201`, `252-257`, `281-286`, `452-458`, `475-478` 他                               |
| 問題 | WS / ICE / `connectionState` からそれぞれ `disconnect` と `disconnect` CB              |
| 対応 | `private disconnecting = false` で idempotent 化。`disconnect` CB は 1 セッション 1 回 |

#### idempotent 化の設計

`disconnect()` の先頭で `disconnecting` フラグをチェックし、true の場合は早期 return する。フラグは `connect()` の先頭でリセットする（次のセッションで再 disconnect できるようにするため）。`finally` ではリセットしない（同一セッション内の並発呼び出しを防ぐため）。

`disconnect()` は `reason` と `error` をオプションで受け取り、`callbacks.disconnect` を内部で発火する。呼び出し元では `callbacks.disconnect` を発火しない。

```ts
public async disconnect(reason?: string, error?: unknown): Promise<void> {
  if (this.disconnecting) return;
  this.disconnecting = true;
  // DataChannel / PeerConnection / WebSocket を閉じる
  // ...
  this.callbacks.disconnect({ reason: reason ?? "UNKNOWN", error });
}

public async connect(...): Promise<void> {
  this.disconnecting = false; // 次のセッションのためにリセット
  // connect 処理
}
```

**注意**: 0002 の `bye` 分岐は `disconnect()` の完了後に `callbacks.disconnect` を呼ぶ設計だが、0005 の idempotent 化後は `disconnect()` 内部で発火するため、0002 の `.then(() => callbacks.disconnect(...))` を削除する必要がある。0002 と 0005 のマージ順序に注意すること。

### F. クローズ待ちポーリングのタイムアウト

| 項目 | 内容                                                                        |
| ---- | --------------------------------------------------------------------------- |
| 場所 | `src/ayame.ts:55`（`POLLING_INTERVAL_MS`）, `688-697`, `715-728`, `751-766` |
| 問題 | `setInterval` が `closed` まで永続しうる                                    |
| 対応 | 例: 5 秒で `clearInterval` して resolve。定数はファイル先頭に定義           |

### G. `audio.enabled` / `video.enabled` 無視

| 項目 | 内容                                                                                |
| ---- | ----------------------------------------------------------------------------------- |
| 場所 | `src/ayame.ts:331-401`                                                              |
| 問題 | `stream` があり `recvonly` でなければ `addTrack`                                    |
| 対応 | `enabled === false` のときは当該メディアの `addTrack` / `addTransceiver` をスキップ |

### H. `connect(..., null)` 後の `authnMetadata` 残留

| 項目 | 内容                                                                                   |
| ---- | -------------------------------------------------------------------------------------- |
| 場所 | `src/ayame.ts:146-148`                                                                 |
| 問題 | 2 回目 `metadataOption === null` でも前回値を register に送る                          |
| 対応 | `metadataOption == null`（null と undefined の両方）のとき `this.authnMetadata = null` |

**注意**: 現在のコード `metadataOption !== null` は undefined を通すため、`connect(stream)` 呼び出し時に `undefined.authnMetadata` にアクセスして TypeError が発生する既存バグも含めて修正する。

## 変更対象ファイル

| ファイル         | 内容                                 |
| ---------------- | ------------------------------------ |
| `src/ayame.ts`   | 上記 A〜H                            |
| `src/types.d.ts` | `enabled` の挙動コメント（G 対応時） |
| `CHANGES.md`     | 項目ごとに FIX / CHANGE              |

## 完了条件

- [ ] A〜H それぞれについて、コードと意図した挙動が一致している
- [ ] D の仕様が issue またはコメントに 1 行で明記されている
- [ ] 破壊的変更（D）が `CHANGES.md` に記載されている
- [ ] モック・スタブなしで、手動または E2E で少なくとも 1 異常系を確認できる（例: 不正 SDP で `SET-ANSWER-ERROR`）
- [ ] `pnpm run build` / lint / typecheck が通る

## テスト方針

AGENTS.md: モック・スタブ禁止。

- 項目 G, H は DevTools でトグル off + connect を手動確認可能
- 項目 A は意図的に壊れた answer を送る環境が必要（0006 で WebSocket 経由の検証を検討）
- 項目 E は disconnect 連打・WS 切断 + ICE failed の手動確認

## 実装手順

1. 0001 / 0002 をマージ済みであることを確認する。
2. **推奨実装順**: E（idempotent）→ A, A2 → B + 0001 確認 → C → G, H → D → F。
3. D の仕様は「`failed` のみ切断」に決定済み。
4. CHANGES.md は issue 完了時に追記する。

## スコープ外

- `getSelectedCodecs` の RTX フィルタ精度（別 issue 化可）
- シグナリングメッセージの完全な型安全化（改善レベル）
- Ayame サーバ仕様書の更新
