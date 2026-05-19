# シグナリングと WebRTC のエラーパスを整備する

- Priority: Medium
- Created: 2026-05-19
- Model: Composer
- Branch: feature/fix-signaling-webrtc-error-paths

## 目的

シグナリングと PeerConnection の異常系で、未処理の Promise rejection・リソースリーク・サイレント失敗が起きないようにする。

## 優先度根拠

通常の happy path では再現しにくいが、ネットワーク揺らぎ・再ネゴ・順序ずれの ICE で接続不能やリークにつながる。SDK 品質として Medium とする。

## 現状

| 箇所 | 問題 |
|------|------|
| `setAnswer`（`ayame.ts:610-616`） | try/catch がなく `void this.setAnswer(...)` で unhandled rejection になりうる |
| glare 時（`259-262`, `484-491`） | 旧 `RTCPeerConnection` を `close()` せず上書き |
| `addIceCandidate`（`635-642`） | 失敗を空 `catch` で握り潰し。SDP 前の candidate が失われうる |
| ICE `disconnected`（`452-458`） | `failed` と同様に即 `disconnect` |
| `disconnect` 複数経路 | WS `onclose` / ICE / `connectionState` から二重呼び出し・コールバック重複の余地 |
| `closePeerConnection` / `closeDataChannel` | `setInterval` にタイムアウトがなく、完了しない場合リークしうる |
| `audio.enabled` / `video.enabled` | `recvonly` 以外で `stream` があると `addTrack` されうる |

## 設計方針

- `setAnswer` を `setOffer` と同様に try/catch + `disconnect` コールバック
- PC 差し替え前に旧 PC を `close()`、イベントハンドラ解除
- ICE candidate は `remoteDescription` 設定前はキューし、設定後にフラッシュ（恒久失敗のみログ）
- `disconnected` は猶予または `failed` のみ切断など、挙動を仕様として決めて `reason` を分離
- `disconnect()` を idempotent 化（`disconnecting` フラグ等）
- クローズ待ちポーリングに上限時間を設ける
- `enabled: false` のときは `addTrack` / `addTransceiver` しない

## 完了条件

- 上記各項目について、意図した挙動がコードと一致している
- 異常系の手順またはテストで回帰を検出できる（モック・スタブは使用しない）
- 破壊的挙動変更（ICE `disconnected` 扱い）は CHANGES.md に `[CHANGE]` または `[FIX]` で記載

## 解決方法

- `src/ayame.ts` を段階的に修正（1 項目ずつコミット可能な粒度に分割してもよい）
- 必要なら Ayame シグナリング仕様との整合を確認する
