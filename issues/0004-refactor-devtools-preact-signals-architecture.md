# DevTools を Preact Signals のベストプラクティスに沿って再構成する

- Priority: Medium
- Created: 2026-05-19
- Model: Composer
- Branch: feature/refactor-devtools-preact-signals-architecture

## 目的

Ayame DevTools を AGENTS.md の「サンプルはお手本」に合わせ、Preact Signals（`computed` / `action` / `createModel` / `batch`）を正しく使った接続サンプルにする。

## 優先度根拠

SDK 利用者が DevTools をコピーする前提では、状態管理と接続フローの品質がそのまま伝播する。致命的バグ（issue 0001〜0003）のうち DevTools 側は 0003 と重なるが、設計改善として Medium とする（0003 完了後に着手してもよい）。

## 現状

- `devtools/src/signals.ts` に全 state が平坦に並ぶ
- `useSignalEffect` で派生値（コーデック一覧）を同期している（`AudioCodecMimeType.tsx` 等）
- `ConnectButton` に接続・メディア取得・コールバック登録が集中
- UI にある `standalone` / `clientId` / デバイス ID が `createConnection` に渡らない
- `audioCodecMimeType` が文字列 `"undefined"` を sentinel にしている
- 死にシグナル `ayameVersion`（書き込みのみ）
- 未使用依存 `preact-iso`

## 設計方針

1. **`createModel` + `useModel` で接続ドメインを集約**
   - `AyameSessionModel`（仮称）: `connection`, `connectionState`, `localStream`, `remoteStream`, `connect()`, `disconnect()`
   - メソッドは自動 `action` ラップ。二重 Connect 時は先に `disconnect`

2. **`connectionOptions` を `computed` で組み立て**
   - `defaultOptions` を破壊しない
   - `standalone`, `clientId`, `signalingKey`, audio/video 設定を含める
   - codec 未指定は `null`（文字列 `"undefined"` を廃止）

3. **派生値は `useComputed`**
   - `getAvailableCodecs` の結果は `useSignalEffect` ではなく `useComputed`
   - `mediaConstraints`（解像度・`deviceId`）も `computed` に集約し、`ConnectButton` と `RequestMediaPermissionButton` で共有

4. **切断・URL 同期は `action` / `batch`**
   - `resetMediaAndConnection` を `action` 化
   - `generateUrlParams` と `setSettingsFromUrl` を対称化（`clientId` を URL に含める）

5. **表示**
   - `DatasetConnectionState` は `connectionState` の `computed` を 1 本化（`pc.connectionState` と SDK 内部状態の混同を解消）
   - 可能なら Text node 最適化（`{signal}` 直渡し）を検討

6. **削除**
   - `ayameVersion` signal、`preact-iso` 依存

## 完了条件

- Connect 時に UI の `standalone` / `clientId` / 入出力デバイス ID が `ConnectionOptions` / `getUserMedia` に反映される
- 接続中の再 Connect で前セッションがリークしない
- `defaultOptions` をミュートしない
- コーデック select が direction 変更に追従する（`useComputed`）
- `pnpm run lint:devtools` / `typecheck` / 既存 E2E が通る

## 解決方法

- `devtools/src/models/`（または同等）に `AyameSessionModel` を追加
- `signals.ts` を設定用 signal と session model に分割
- 各コンポーネントを段階的に移行（Connect / Disconnect → コーデック → URL → 権限 effect）
- issue 0003 と併せて `connectionOptions` computed を導入する
