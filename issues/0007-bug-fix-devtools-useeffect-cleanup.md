# DevTools の useEffect cleanup が登録されない問題を修正する

- Priority: High
- Created: 2026-05-19
- Model: Composer 2.5
- Branch: feature/fix-devtools-useeffect-cleanup

## 目的

Ayame DevTools の Preact コンポーネントで、`useEffect` の cleanup が実行されず、`permissionStatus.onchange` や非同期完了後の `setState` がアンマウント後も残る問題を修正する。SDK コアのバグと同等に、お手本サンプルとして致命的な品質欠陥である。

## 優先度根拠

- Preact の契約違反であり、HMR・画面遷移・コンポーネント再マウントで **リスナ重複** と **アンマウント後更新** が起きうる
- 利用者が DevTools のデバイス選択・権限 UI をコピーすると同じバグを再現する
- 修正は局所的で、0004 の大規模リファクタより先に単独マージできる
- そのため High とする（0004 は Medium の設計改善、本 issue はバグ修正）

## 現状

### 症状

- デバイス select を何度も開閉したり、DevTools を HMR したりすると、権限変更ハンドラが重複して動く可能性がある
- アンマウント後に `setDevices` が走り、コンソール警告や意図しない UI 更新が起きうる

### 原因（Preact Hooks の誤用）

`useEffect` のコールバックは **同期関数** であり、cleanup はその **直接の return** のみが有効。async 関数の内側で `return () => {...}` しても Preact には届かない。

**該当ファイル（同一パターン）:**

| ファイル                                        | 行   |
| ----------------------------------------------- | ---- |
| `devtools/src/components/AudioInputDevice.tsx`  | 8-44 |
| `devtools/src/components/VideoInputDevice.tsx`  | 8-44 |
| `devtools/src/components/AudioOutputDevice.tsx` | 8-44 |

```38:44:devtools/src/components/AudioInputDevice.tsx
      return (): void => {
        permissionStatus.onchange = null;
      };
    };
    void getDevices();
  }, []);
```

上記 `return` は `getDevices`（async）の戻り値であり、`useEffect` 自体は `undefined` を返している。

### 関連（本 issue に含める）

| ファイル                                                         | 問題                                                                                                  |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `devtools/src/components/RequestMediaPermissionButton.tsx:15-54` | `permission.onchange` の cleanup なし。`deps: []` で `audioEnabled` / `videoEnabled` 変更に追従しない |
| `devtools/src/components/MicrophonePermissionState.tsx:4`        | モジュール import 時に `void setMicrophonePermissionState()`                                          |
| `devtools/src/components/CameraPermissionState.tsx:4`            | モジュール import 時に `void setCameraPermissionState()`                                              |
| `devtools/src/App.tsx:14-15`                                     | render 内で `setSettingsFromUrl`（毎 render 副作用）                                                  |

`signals.ts` の `setMicrophonePermissionState` / `setCameraPermissionState` も、コンポーネントの `useSignalEffect` + cleanup に移す。

## 設計方針

1. **デバイス 3 コンポーネント**: `useEffect` の同期 return で `onchange = null` と `cancelled = true` を行う。async 処理は IIFE 内で行い、cleanup を async から return しない。
2. **RequestMediaPermissionButton**: 各 `PermissionStatus` の `onchange` を effect の cleanup で解除。`audioEnabled` / `videoEnabled` は `useSignalEffect` で購読する。
3. **権限表示コンポーネント**: モジュールトップレベルの `void set*()` を削除し、コンポーネント内 `useSignalEffect` に移す。
4. **App.tsx**: `setSettingsFromUrl` を `useEffect(() => { ... }, [])` に移す。

### 修正パターン（デバイス列挙・参考）

```tsx
useEffect(() => {
  let cancelled = false;
  let permissionStatus: PermissionStatus | undefined;

  const handlePermissionChange = async (): Promise<void> => {
    if (cancelled || !permissionStatus) return;
    // enumerateDevices + setDevices ...
  };

  void (async () => {
    permissionStatus = await navigator.permissions.query({
      name: "microphone" as PermissionName,
    });
    if (cancelled) return;
    void handlePermissionChange();
    permissionStatus.onchange = () => {
      void handlePermissionChange();
    };
  })();

  return () => {
    cancelled = true;
    if (permissionStatus) {
      permissionStatus.onchange = null;
    }
  };
}, []);
```

## 変更対象ファイル

| ファイル                                                   | 変更内容                                                   |
| ---------------------------------------------------------- | ---------------------------------------------------------- |
| `devtools/src/components/AudioInputDevice.tsx`             | cleanup 修正                                               |
| `devtools/src/components/VideoInputDevice.tsx`             | cleanup 修正                                               |
| `devtools/src/components/AudioOutputDevice.tsx`            | cleanup 修正                                               |
| `devtools/src/components/RequestMediaPermissionButton.tsx` | cleanup + signal 購読                                      |
| `devtools/src/components/MicrophonePermissionState.tsx`    | 副作用を effect へ                                         |
| `devtools/src/components/CameraPermissionState.tsx`        | 副作用を effect へ                                         |
| `devtools/src/components/App.tsx`                          | URL 初期化を effect へ                                     |
| `devtools/src/signals.ts`                                  | 権限 setter は export のまま、呼び出し元をコンポーネントへ |
| `CHANGES.md`                                               | `## develop` に `[FIX]`                                    |

## 完了条件

- [ ] デバイス 3 コンポーネントで、コンポーネントのアンマウント後に `permissionStatus.onchange` が `null` である（DevTools で該当 UI を表示→別画面へ遷移、または Story 的に mount/unmount を繰り返して確認）
- [ ] アンマウント後に `setDevices` が呼ばれない（`cancelled` ガード）
- [ ] `RequestMediaPermissionButton` で Audio / Video トグル変更後も権限 UI が正しく更新される
- [ ] `App.tsx` の render 内で `setSettingsFromUrl` が呼ばれない
- [ ] モジュール import 時の `void setMicrophonePermissionState()` / `void setCameraPermissionState()` が無い
- [ ] `pnpm run lint:devtools` / `typecheck` / 既存 Playwright E2E が通る
- [ ] `CHANGES.md` に `[FIX]` 記載済み

## テスト方針

AGENTS.md: モック・スタブ禁止。

### 手動（必須）

1. DevTools を開き、Media settings のデバイス select を表示
2. ブラウザのマイク権限を変更（または HMR でコンポーネントを再読み込み）
3. コンソールにアンマウント後更新の警告が出ないこと
4. Audio / Video トグルを変更し、Request Media Permission ボタンの `disabled` が追従すること

### E2E

既存 `tests/devtools.test.ts` が通ればよい。本 issue 単体での新規 E2E は任意（0006 で拡張可）。

## 解決方法（実装手順）

1. `AudioInputDevice.tsx` / `VideoInputDevice.tsx` / `AudioOutputDevice.tsx` を上記パターンに修正する。
2. `RequestMediaPermissionButton.tsx` に cleanup と `useSignalEffect` を追加する。
3. `MicrophonePermissionState.tsx` / `CameraPermissionState.tsx` からモジュールトップレベル副作用を削除する。
4. `App.tsx` で URL 初期化を `useEffect` に移す。
5. 手動確認と E2E を実行する。
6. `CHANGES.md` に追記する。

## 関連 issue

| issue | 関係                                                    |
| ----- | ------------------------------------------------------- |
| 0004  | 本 issue 完了後に着手推奨。Hooks cleanup は 0007 に委譲 |
| 0006  | E2E 恒久化                                              |

## スコープ外

- `createModel` / `connectionOptions` computed（0004）
- SDK 本体（0001〜0003, 0005）
