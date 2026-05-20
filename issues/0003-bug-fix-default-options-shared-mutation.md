# 公開 defaultOptions の共有ミュータブル化を解消する

- Priority: High
- Created: 2026-05-19
- Model: Composer 2.5
- Branch: feature/fix-default-options-shared-mutation

## 目的

export された `defaultOptions` を利用者が破壊的に変更できてしまう問題を解消し、複数 `Connection`・再接続時の設定混線を防ぐ。DevTools がお手本として正しい渡し方を示す。

## 優先度根拠

`defaultOptions` は公開 API として export されている。DevTools が参照をそのまま書き換えており、利用者がサンプルをコピーすると同じ footgun が再現する。DevTools を修正し、お手本として正しい渡し方（`createDefaultOptions`）を示すことで、公開 API の信頼性を回復する。`defaultOptions` の直接ミュートは残るが、`createDefaultOptions` を推奨し、将来的に `defaultOptions` を deprecated とする。High とする。

## 現状

### SDK

- `export const defaultOptions` がモジュールスコープの **単一オブジェクト**（`src/ayame.ts:794-805`）
- `clientId` はモジュールロード時に **1 回だけ** `crypto.randomUUID()` が入る
- `createConnection(..., options = defaultOptions)` のデフォルト引数も同一参照（`src/ayame.ts:822-827`）

### DevTools（再現例）

```25:34:devtools/src/components/ConnectButton.tsx
    const options = defaultOptions;
    options.audio.enabled = audioEnabled.value;
    options.audio.direction = audioDirection.value;
    options.audio.codecMimeType = audioCodecMimeType.value;
    options.video.enabled = videoEnabled.value;
    options.video.direction = videoDirection.value;
    options.video.codecMimeType = videoCodecMimeType.value;
    options.signalingKey = signalingKey.value;

    const conn = createConnection(signalingUrl.value, roomId.value, options, debug.value);
```

2 回目の Connect で 1 回目の `signalingKey` / direction 等が残る。

## 設計方針

### SDK（必須）

1. **`export const createDefaultOptions(): ConnectionOptions` を追加**し、呼び出しごとに新しいオブジェクト（ネストした `audio` / `video` も新規）を返す。`ConnectionOptions`（`src/types.d.ts:24-37`）の全フィールドを含める。オプショナルフィールド（`signalingKey` / `standalone` / `codecMimeType`）は `undefined` を明示する。
2. `defaultOptions` は後方互換のため **残す**。`Object.freeze` は **適用しない**（`Connection` コンストラクタが `this.options` を参照コピーし、freeze されたオブジェクトのプロパティ変更で実行時エラーが発生するため）。利用者向けに `createDefaultOptions` を推奨する。
3. `createConnection` のデフォルト引数は `createDefaultOptions()` を呼ぶ形に変更する（`options = defaultOptions` をやめる）。
4. `connection()` deprecated 関数（`src/ayame.ts:811-817`）は **現状のまま残す**（deprecated 関数の挙動変更は後方互換を壊すため）。ただし、`connection()` も同一の共有ミュータブル問題を抱えている。将来的に `connection()` を削除することで解決する。

### DevTools（本 issue で最低限必須）

- `ConnectButton.tsx` で **毎回新しい `ConnectionOptions`** を組み立てて `createConnection` に渡す（スプレッドで `audio` / `video` もコピー）。
- issue 0004 の `computed` 化は 0004 で行ってよいが、**0003 完了時点でミュートは禁止**。

### 後方互換

- `defaultOptions` の export を削除するのは **本 issue のスコープ外**（`[CHANGE]` が必要）。`createDefaultOptions` 追加は `[ADD]`。

## 変更対象ファイル

| ファイル                                    | 変更内容                                                     |
| ------------------------------------------- | ------------------------------------------------------------ |
| `src/ayame.ts`                              | `createDefaultOptions` 追加（export）、`createConnection` のデフォルト引数変更 |
| `devtools/src/components/ConnectButton.tsx` | 毎回新規 options オブジェクト                                |
| `CHANGES.md`                                | `[ADD]` + DevTools 修正は misc                               |

## 完了条件

- [ ] 連続 2 回 `createConnection`（または DevTools で 2 回 Connect）で、1 回目の `signalingKey` / direction が 2 回目に漏れない
- [ ] `createDefaultOptions()` を 2 回呼ぶと `clientId` が異なる（または意図どおり毎回新規 UUID）
- [ ] DevTools が `defaultOptions` のプロパティを直接書き換えない（ミュート禁止）
- [ ] `pnpm run build` / `typecheck` / lint が通る
- [ ] `CHANGES.md` に `createDefaultOptions` の `[ADD]` と、挙動修正の `[FIX]`（該当する場合）を記載

## テスト方針

モック・スタブ禁止。

### 手動（最小）

DevTools で Connect → 設定変更 → 再度 Connect。2 回目が 1 回目の設定に引きずられないこと。

### E2E（任意・0006 と連携）

2 回 Connect 間で room ID 以外の設定を変え、2 回目に反映されることを確認。

## 解決方法（実装手順）

1. `src/ayame.ts` に `createDefaultOptions()` を実装する。`ConnectionOptions`（`src/types.d.ts:24-37`）の全フィールドを含める。オプショナルフィールドは `undefined` を明示する。

   ```ts
   export const createDefaultOptions = (): ConnectionOptions => ({
     audio: { codecMimeType: undefined, direction: "sendrecv", enabled: true },
     clientId: crypto.randomUUID(),
     iceServers: [],
     signalingKey: undefined,
     standalone: undefined,
     video: { codecMimeType: undefined, direction: "sendrecv", enabled: true },
   });
   ```

2. `createConnection` の第 3 引数デフォルトを `createDefaultOptions()` に変更する。
3. `connection()` deprecated 関数（`src/ayame.ts:811-817`）は **現状のまま残す**（deprecated 関数の挙動変更は後方互換を壊すため）。
4. `defaultOptions` は **現状のまま残す**（モジュールロード時に 1 回だけ生成される挙動を維持）。`createDefaultOptions` を別途追加し、利用者向けに推奨する。`defaultOptions` の `Object.freeze` は適用しない（`Connection` コンストラクタが `this.options` を参照コピーし、freeze されたオブジェクトのプロパティ変更で実行時エラーが発生するため）。
5. `ConnectButton.tsx` を次の形に変更する（`handleClick` 内で毎回 `createDefaultOptions()` を呼ぶ）。

   ```ts
   const base = createDefaultOptions();
   const options: ConnectionOptions = {
     ...base,
     audio: {
       ...base.audio,
       enabled: audioEnabled.value,
       direction: audioDirection.value,
       codecMimeType:
         audioCodecMimeType.value === "undefined" ? undefined : audioCodecMimeType.value,
     },
     video: {
       ...base.video,
       enabled: videoEnabled.value,
       direction: videoDirection.value,
       codecMimeType:
         videoCodecMimeType.value === "undefined" ? undefined : videoCodecMimeType.value,
     },
     signalingKey: signalingKey.value || undefined,
   };
   ```

   （`"undefined"` 文字列の廃止は 0004 で行ってよい。0003 ではミュート防止が優先。）

6. `CHANGES.md` の `## develop` に次を追記する（セクション末尾、`[ADD]` は `[UPDATE]` の前、`[FIX]` は `[ADD]` の後）。
   - `- [ADD] createDefaultOptions 関数を追加する`
   - `  - @ユーザー名`（担当者行、2 文字インデント）
   - `- [FIX] DevTools で defaultOptions を直接書き換えていた問題を修正する`
   - `  - @ユーザー名`（担当者行、2 文字インデント）

## 関連 issue

| issue | 関係                                                      |
| ----- | --------------------------------------------------------- |
| 0004  | `connectionOptions` の `computed` 化、codec sentinel 廃止 |
| 0006  | 回帰テスト                                                |

## スコープ外

- `connection()` deprecated 関数の削除
- `defaultOptions` export の完全削除
