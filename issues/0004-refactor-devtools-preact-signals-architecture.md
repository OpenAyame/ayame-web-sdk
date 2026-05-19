# DevTools を Preact / Preact Signals のベストプラクティスに沿って再構成する

- Priority: Medium
- Created: 2026-05-19
- Model: Composer 2.5
- Branch: feature/refactor-devtools-preact-signals-architecture

## 目的

Ayame DevTools を AGENTS.md の「サンプルは **お手本**」に合わせ、Preact 10 + `@preact/signals` の推奨パターン（`computed` / `action` / `createModel` / `useModel`、Hooks の正しい cleanup）で実装し直す。UI にある設定が接続・メディア取得に確実に反映されるようにする。

## 優先度根拠

利用者が DevTools をコピーする前提では、状態管理・副作用の置き場・接続フローの品質がそのまま伝播する。SDK の致命的バグ（0001〜0003）とは別軸だが、お手本としての価値が高い。0003 完了後の着手を推奨するため Medium とする。

## 前提・依存

| issue       | 関係                                                                                           |
| ----------- | ---------------------------------------------------------------------------------------------- |
| 0007        | **必須前提**。Preact `useEffect` cleanup 不備のバグ修正（High）。本 issue より先に完了すること |
| 0003        | `defaultOptions` のミュート禁止。本 issue では `computed` で `ConnectionOptions` を組み立てる  |
| 0001 / 0002 | SDK 側バグ。DevTools だけでは再接続・bye の検証は不十分                                        |

## 現状

### アーキテクチャ

- `devtools/src/signals.ts` に設定・接続・権限が平坦に並ぶ
- `ConnectButton.tsx` に connect / `getUserMedia` / SDK コールバック登録が集中（約 90 行）
- Hooks と Signals が混在（デバイス一覧は `useState`、選択値は module `signal`）

### バグ・不整合（0007 で対応済みとする項目）

Preact `useEffect` cleanup 不備・権限 UI の副作用は **issue 0007** で修正する。本 issue 着手時は 0007 が `develop` にマージ済みであること。

| 箇所                                 | 問題                           | 対応 issue |
| ------------------------------------ | ------------------------------ | ---------- |
| `AudioInputDevice.tsx` 等 3 ファイル | async 内 return cleanup        | 0007       |
| `RequestMediaPermissionButton.tsx`   | `onchange` cleanup / deps      | 0007       |
| `MicrophonePermissionState.tsx` 等   | モジュール import 副作用       | 0007       |
| `App.tsx`                            | render 内 `setSettingsFromUrl` | 0007       |

### バグ・不整合（本 issue で対応）

| 箇所                                     | 問題                                                      |
| ---------------------------------------- | --------------------------------------------------------- |
| `ConnectButton.tsx`                      | `standalone` / `clientId` 未渡し。二重 Connect ガードなし |
| `signals.ts:29,33`                       | codec 未指定が文字列 `"undefined"`                        |
| `signals.ts:9`, `AyameWebSdkVersion.tsx` | `ayameVersion` signal 未使用                              |
| `package.json`                           | `preact-iso` 未使用                                       |

### UI と接続のギャップ

- `audioInputDeviceId` / `videoInputDeviceId` が `getUserMedia` に渡らない
- `generateUrlParams` に `clientId` が無い（`setSettingsFromUrl` は読む）

## 設計方針

### 1. 接続ドメイン: `createModel` + `useModel`

`devtools/src/models/ayameSession.ts`（仮）を新設。

| メンバ                         | 種別                         | 責務                                                                        |
| ------------------------------ | ---------------------------- | --------------------------------------------------------------------------- |
| `connection`                   | `signal<Connection \| null>` | 現在の SDK 接続                                                             |
| `connectionState`              | `computed`                   | `peerConnection?.connectionState ?? "new"`（SDK 内部 ICE 状態と混同しない） |
| `localStream` / `remoteStream` | `signal`                     | メディア                                                                    |
| `isConnecting`                 | `computed`                   | 接続処理中                                                                  |
| `canConnect`                   | `computed`                   | 接続可能か                                                                  |
| `connect(buildOptions)`        | `action`                     | 既存接続があれば先に `disconnect`                                           |
| `disconnect()`                 | `action`                     | トラック停止 + signal クリア + `conn.disconnect()`                          |

`ConnectButton` / `DisconnectButton` は model のメソッドを呼ぶだけに薄くする。

### 2. 設定: `connectionOptions` を `computed`

`signals.ts` または `connectionOptions.ts` で:

```ts
export const connectionOptions = computed(
  (): ConnectionOptions => ({
    ...createDefaultOptions(),
    clientId: clientId.value,
    standalone: standalone.value || undefined,
    signalingKey: signalingKey.value || undefined,
    audio: {
      /* signals から */
    },
    video: {
      /* signals から */
    },
  }),
);
```

- `audioCodecMimeType` / `videoCodecMimeType` は `signal<string | null>(null)`。UI の「未指定」は `null`。
- **0003 完了後**に導入し、`defaultOptions` を直接書き換えない。

### 3. メディア制約: `mediaConstraints` を `computed`

`ConnectButton` と `RequestMediaPermissionButton` で共有。

- `deviceId` を `audioInputDeviceId` / `videoInputDeviceId` から反映
- `videoResolution` を既存ロジックどおり `ideal` 幅高に変換

### 4. Preact Hooks（0007 に委譲）

`useEffect` cleanup・権限副作用・App の URL 初期化は **0007 で完了している前提** とする。0004 では触らない。

### 5. 派生 UI: `useComputed`

- `AudioCodecMimeType` / `VideoCodecMimeType`: `useSignalEffect` で `codecs` を同期するのをやめ、`useComputed(() => getAvailableCodecs(...))` にする。

### 6. 削除

- `ayameVersion` signal（表示は `version()` のみ）
- `preact-iso` 依存
- 開発時のみ `import "preact/debug"` を `main.tsx` に追加（任意だが推奨）

## 変更対象ファイル（一覧）

| パス                                                | 操作                   |
| --------------------------------------------------- | ---------------------- |
| `devtools/src/models/ayameSession.ts`               | 新規                   |
| `devtools/src/signals.ts`                           | 分割・整理             |
| `devtools/src/components/ConnectButton.tsx`         | 薄型化                 |
| `devtools/src/components/DisconnectButton.tsx`      | model 利用             |
| `devtools/src/components/AudioCodecMimeType.tsx` 等 | `useComputed`          |
| `devtools/src/main.tsx`                             | `preact/debug`（任意） |
| `devtools/package.json`                             | `preact-iso` 削除      |
| `CHANGES.md`                                        | misc または `[UPDATE]` |

## 完了条件

- [ ] Connect 時に `standalone` / `clientId` / 入出力 `deviceId` / 解像度が反映される
- [ ] 接続中の再 Connect で前セッションがリークしない（`canConnect` / `isConnecting` でボタン制御）
- [ ] `defaultOptions` をミュートしない（`connectionOptions` computed）
- [ ] issue 0007 がマージ済みであること（Hooks cleanup・権限副作用・App URL 初期化）
- [ ] codec 未指定が文字列 `"undefined"` ではない
- [ ] `pnpm run lint:devtools` / `pnpm run typecheck` / 既存 Playwright E2E が通る
- [ ] `CHANGES.md` に DevTools 再構成を記載（機能追加に該当する場合は `[UPDATE]`）

## テスト方針

- 既存 `tests/devtools.test.ts` / `tests/codec.test.ts` が通ること
- standalone: URL に `standalone=true` を付けて Connect し、シグナリング挙動が変わること（手動または E2E 拡張は 0006）
- モック・スタブ禁止（AGENTS.md）

## 実装手順（推奨順）

1. issue 0007 がマージ済みであることを確認する
2. `createDefaultOptions` 連携の `connectionOptions` computed（0003 後）
3. `AyameSessionModel` 導入 + Connect / Disconnect 移行
4. `mediaConstraints` computed + デバイス ID 反映
5. codec を `useComputed` 化、死にコード・`preact-iso` 削除
6. lint / E2E / CHANGES

## スコープ外

- SDK 本体（`src/ayame.ts`）の修正（0001 / 0002 / 0005）
- Tailwind / レイアウトの大幅変更
- `preact-iso` ルーティング導入

## 関連 issue

0001, 0002, 0003, 0006, 0007
