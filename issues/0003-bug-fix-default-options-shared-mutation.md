# 公開 defaultOptions の共有ミュータブル化を解消する

- Priority: High
- Created: 2026-05-19
- Model: Composer
- Branch: feature/fix-default-options-shared-mutation

## 目的

export された `defaultOptions` を利用者が破壊的に変更できてしまう問題を解消し、複数接続・再接続時の設定混線を防ぐ。

## 優先度根拠

DevTools が `defaultOptions` を直接書き換えており、お手本としても利用者コードとしても footgun になる。公開 API の信頼性に関わる High とする。

## 現状

- `src/ayame.ts` で `export const defaultOptions` がモジュールスコープの単一オブジェクト
- `clientId` はモジュールロード時に 1 回だけ `crypto.randomUUID()` が入る
- `devtools/src/components/ConnectButton.tsx` が参照を取り、プロパティを上書きしている

```25:32:devtools/src/components/ConnectButton.tsx
    const options = defaultOptions;
    options.audio.enabled = audioEnabled.value;
    options.audio.direction = audioDirection.value;
```

## 設計方針

SDK 側（いずれか、または併用）:

- `createDefaultOptions(): ConnectionOptions` ファクトリを追加し、毎回新しいオブジェクトを返す
- `defaultOptions` を `Object.freeze` した読み取り専用テンプレートにする、または export を deprecate する

DevTools 側:

- 接続ごとに `{ ...defaultOptions, audio: { ... }, ... }` の深いコピーを渡す（Preact Signals では `computed` で組み立てるのが望ましい。詳細は issue 0004）

## 完了条件

- 連続 2 回の `createConnection` で、1 回目の設定が 2 回目に漏れない
- DevTools が `defaultOptions` を破壊的に変更しない
- 後方互換方針（`defaultOptions` を残すか）を CHANGES.md に記載する

## 解決方法

- SDK に非破壊的な `createDefaultOptions()` を追加、またはドキュメント化されたコピーパターンを提供
- `ConnectButton` を修正し、毎回新しい `ConnectionOptions` を `createConnection` に渡す
