# SDK コアの挙動を検証するテストを追加する

- Priority: Medium
- Created: 2026-05-19
- Model: Composer 2.5
- Branch: feature/add-sdk-behavior-coverage

## 目的

Playwright E2E（DevTools 経由）のみに依存しているテスト構成を改め、SDK 修正（issue 0001〜0005）の回帰を検出できるテストと CI 上の実行方針を整備する。

## 優先度根拠

0001〜0005 をマージしても、再接続・bye・コーデック・異常系の退行を自動検出できない。`develop` 向け `ci.yml` に Playwright が無く、品質ゲートが lint / build のみのため Medium とする。

## 前提・依存

| issue | 本 issue で検証すべき内容                                                |
| ----- | ------------------------------------------------------------------------ |
| 0001  | disconnect → reconnect で `addstream` / リモート映像                     |
| 0002  | 相手 disconnect 後の `disconnect` CB / 状態                              |
| 0003  | 2 回 Connect で設定混線なし                                              |
| 0005  | 一部異常系（優先度低、手動でも可）                                       |
| 0007  | DevTools Hooks 修正後、E2E の `data-connection-state` アサートが安定する |

**0001 / 0002 の修正マージ後**に E2E ケースを追加すること。先行追加する場合は `test.skip` と理由コメントを付ける（AGENTS.md: テストメッセージは日本語で理由を記載）。

## 現状

| 項目            | 状態                                                                |
| --------------- | ------------------------------------------------------------------- |
| `tests/`        | `devtools.test.ts`, `codec.test.ts`, `version.test.ts` のみ         |
| SDK 単体        | `getSelectedCodecs` / `getAvailableCodecs` / `signaling()` 未テスト |
| `codec.test.ts` | UI でコーデック選択するが、ネゴ結果は未検証（`connected` のみ）     |
| `ci.yml`        | build / lint / typecheck のみ                                       |
| `e2e-test.yml`  | Playwright。`secrets.TEST_SIGNALING_*` 必須                         |
| AGENTS.md       | モック・スタブ禁止                                                  |

### 既知のテスト負債

- `tests/version.test.ts` は `devtools.test.ts` と重複（削除候補）
- `playwright.config.mts`: `workers: 1` と `describe.parallel` が併存
- disconnect クリック後のアサーションなし

## 設計方針

モック・スタブは使わない。次の 3 層で段階的に足す。

### 層 1: ブラウザ API を使う E2E 拡張（最優先）

既存の DevTools + 実 Ayame を継続利用。

| テスト            | 内容                                                              | 依存 issue |
| ----------------- | ----------------------------------------------------------------- | ---------- |
| 再接続            | connect → disconnect → connect。2 回目も connected / リモート表示 | 0001       |
| bye / 相手切断    | 2 タブ。一方 disconnect → 他方の状態                              | 0002       |
| コーデック        | `page.evaluate` で `RTCRtpSender.getParameters().codecs` 等を検証 | 0005 任意  |
| disconnect 後状態 | disconnect 後 `data-connection-state` が connected でない         | 0001       |

### 層 2: 純粋関数（ブラウザ必須なら Playwright `evaluate`）

`getSelectedCodecs` / `getAvailableCodecs` は `RTCRtpCodecCapability` 配列を **テスト内に固定データとして定義**し、`page.evaluate` で SDK 関数を呼ぶか、将来 `export` して DevTools 経由で検証する。

- Node 単体のみで完結させる場合は、関数をテスト可能なモジュールに分離するリファクタが先に必要。**本 issue のスコープでは E2E + evaluate を第一選択**とする。

### 層 3: CI

| 変更         | 内容                                                                                                                         |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| 短期         | `ci.yml` には secrets 不要なチェックのみ維持。E2E は `e2e-test.yml` 継続                                                     |
| 中期         | `getSelectedCodecs` 用の Playwright 1 本を `e2e-test.yml` に含める                                                           |
| ドキュメント | ローカル E2E に必要な env（`.env.template` 参照）を issue 完了時に README ではなくコミットメッセージ / CHANGES misc で触れる |

## 変更対象ファイル

| ファイル                                           | 操作                                                   |
| -------------------------------------------------- | ------------------------------------------------------ |
| `tests/reconnect.test.ts`                          | 新規（0001）                                           |
| `tests/bye.test.ts` または `devtools.test.ts` 拡張 | 0002                                                   |
| `tests/codec.test.ts`                              | ネゴ検証追加                                           |
| `tests/version.test.ts`                            | 削除または `devtools.test.ts` に統合                   |
| `playwright.config.mts`                            | `workers` と `parallel` の方針統一、コメントアウト削除 |
| `.github/workflows/e2e-test.yml`                   | 必要なら artifact 保存                                 |
| `CHANGES.md`                                       | misc `[ADD]` テスト追加                                |

## 完了条件

- [ ] 0001 の完了条件が E2E で自動化されている（`tests/reconnect.test.ts` 等）
- [ ] 0002 の完了条件が E2E または手順書 + 1 回の CI 成功ログで確認されている
- [ ] `codec.test.ts` が「connected」以外の指標を 1 つ以上アサートしている
- [ ] `tests/version.test.ts` を削除した場合は `devtools.test.ts` に統合済み
- [ ] テスト名は日本語（AGENTS.md: テストメッセージは日本語）。`codec.test.ts` の英語タイトルを修正
- [ ] `pnpm run test`（ローカル、env 設定済み）が通る
- [ ] `CHANGES.md` にテスト追加を misc で記載

## テスト実装例（再接続・概要）

```ts
// tests/reconnect.test.ts（概要）
import { expect, test } from "@playwright/test";

test("切断後に再接続できる", async ({ browser }) => {
  const page1 = await browser.newPage();
  const page2 = await browser.newPage();

  await page1.goto("http://localhost:9000/");
  await page2.goto("http://localhost:9000/");

  // RoomID を取得して一意にする
  const roomId1 = await page1.evaluate(() => {
    const el = document.querySelector('[data-testid="room-id"]')!;
    return el.value;
  });
  const roomId2 = await page2.evaluate(() => {
    const el = document.querySelector('[data-testid="room-id"]')!;
    return el.value;
  });
  const suffix = crypto.randomUUID();
  await page1.fill('[data-testid="room-id"]', `${roomId1}-${suffix}`);
  await page2.fill('[data-testid="room-id"]', `${roomId2}-${suffix}`);

  // 両方接続
  await page1.click('[data-testid="connect"]');
  await page2.click('[data-testid="connect"]');
  await expect(page1.locator('[data-testid="connection-state"]')).toHaveAttribute(
    "data-connection-state",
    "connected",
    { timeout: 10_000 },
  );
  await expect(page2.locator('[data-testid="connection-state"]')).toHaveAttribute(
    "data-connection-state",
    "connected",
    { timeout: 10_000 },
  );

  // page1 を切断
  await page1.click('[data-testid="disconnect"]');
  await expect(page1.locator('[data-testid="connection-state"]')).not.toHaveAttribute(
    "data-connection-state",
    "connected",
    { timeout: 10_000 },
  );

  // page1 を再接続
  await page1.click('[data-testid="connect"]');
  await expect(page1.locator('[data-testid="connection-state"]')).toHaveAttribute(
    "data-connection-state",
    "connected",
    { timeout: 10_000 },
  );

  await page1.click('[data-testid="disconnect"]');
  await page2.click('[data-testid="disconnect"]');
  await page1.close();
  await page2.close();
});
```

### bye テストの実装例

```ts
// tests/bye.test.ts（概要）
import { expect, test } from "@playwright/test";

test("相手の切断時に disconnect コールバックが発火する", async ({ browser }) => {
  const page1 = await browser.newPage();
  const page2 = await browser.newPage();

  await page1.goto("http://localhost:9000/");
  await page2.goto("http://localhost:9000/");

  // RoomID を取得して一意にする
  const roomId1 = await page1.evaluate(() => {
    const el = document.querySelector('[data-testid="room-id"]')!;
    return el.value;
  });
  const roomId2 = await page2.evaluate(() => {
    const el = document.querySelector('[data-testid="room-id"]')!;
    return el.value;
  });
  const suffix = crypto.randomUUID();
  await page1.fill('[data-testid="room-id"]', `${roomId1}-${suffix}`);
  await page2.fill('[data-testid="room-id"]', `${roomId2}-${suffix}`);

  // 両方接続
  await page1.click('[data-testid="connect"]');
  await page2.click('[data-testid="connect"]');
  await expect(page1.locator('[data-testid="connection-state"]')).toHaveAttribute(
    "data-connection-state",
    "connected",
    { timeout: 10_000 },
  );

  // page1 を切断（page2 に bye が届く）
  await page1.click('[data-testid="disconnect"]');

  // page2 の接続状態が connected でなくなることを確認
  await expect(page2.locator('[data-testid="connection-state"]')).not.toHaveAttribute(
    "data-connection-state",
    "connected",
    { timeout: 10_000 },
  );

  await page2.click('[data-testid="disconnect"]');
  await page1.close();
  await page2.close();
});
```

`data-connection-state` が disconnect でリセットされない場合は、0004 で DevTools 修正後にアサートを調整する。

## 解決方法（実装手順）

1. 0001 / 0002 の修正が `develop` に入っていることを確認する。
2. `tests/reconnect.test.ts` を追加し、ローカルで `vp dev` + Playwright を実行する。
3. `bye` シナリオを追加する。
4. `codec.test.ts` に `page.evaluate` でコーデック検証を追加する。
5. `version.test.ts` を削除し重複を解消する。
6. `playwright.config.mts` を整理する。
7. `CHANGES.md` を更新する。

## スコープ外

- Rust / PBT（本リポジトリは TypeScript SDK）
- Ayame サーバ本体のテスト
- `ci.yml` への secrets 付き E2E 統合（別判断。本 issue では e2e-test.yml 維持で可）

## 関連 issue

0001, 0002, 0003, 0004, 0005
