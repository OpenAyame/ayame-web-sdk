# SDK コアの挙動を検証するテストを追加する

- Priority: Medium
- Created: 2026-05-19
- Model: Composer 2.5
- Branch: feature/add-sdk-behavior-coverage

## 目的

Playwright E2E のみに依存している現状を改め、SDK コア（特に純粋関数とシグナリング契約）の回帰を CI で検出できるようにする。

## 優先度根拠

issue 0001〜0005 の修正後も、再接続・bye・コーデック選択などの退行を防ぐ必要がある。`develop` 向け CI（`.github/workflows/ci.yml`）に Playwright が含まれておらず、テストギャップは Medium とする。

## 現状

- `tests/` は Playwright E2E のみ（DevTools 経由の happy path）
- `getSelectedCodecs`（`src/utils.ts:42-67`）にテストなし
- `getAvailableCodecs` のフィルタロジックにテストなし
- シグナリング状態機械（`signaling()`）に契約テストなし
- `tests/codec.test.ts` は UI 操作のみで、実際のネゴシエーション結果を検証していない
- AGENTS.md: モックやスタブは利用しない

## 設計方針

モック・スタブ禁止の制約下で、次を検討する:

1. **純粋関数**: `getSelectedCodecs` / `getAvailableCodecs` を Node + 実データ（固定の `RTCRtpCodecCapability` 配列）で検証する実行環境を用意する。ブラウザ API が必要なら Playwright の `page.evaluate` で実 `RTCRtpSender.getCapabilities` を使う E2E に寄せる
2. **シグナリング**: 実 Ayame または Playwright の WebSocket インターセプトで `ping`/`pong`/`reject`/`bye` を注入（スタブではなく実プロトコルに近い形）
3. **再接続・切断**: issue 0001〜0002 完了後、2 タブ E2E で disconnect → reconnect と bye をカバー
4. **CI**: 可能な範囲で `ci.yml` に軽量なテストステップを追加（secrets 不要なものから）

## 完了条件

- `getSelectedCodecs` の MIME 大小無視・RTX/red/ulpfec 含有が検証されている
- issue 0001（remoteStream）・0002（bye）の再現手順がテスト化されている
- コーデック E2E が「connected」以外の指標（例: `getParameters().codecs`）を 1 つ以上検証している
- 追加したテストが CI またはドキュメント化された手順で実行される

## 解決方法

- テスト方針を決めたうえで、`tests/` または別ディレクトリにケースを追加
- E2E は `e2e-test.yml` との役割分担を README または issue に明記する
