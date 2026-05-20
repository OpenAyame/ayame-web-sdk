# リリースノート

- CHANGE
  - 下位互換のない変更
- UPDATE
  - 下位互換がある変更
- ADD
  - 下位互換がある追加
- FIX
  - バグ修正

## develop

- [CHANGE] ビルド出力を ayame.mjs から ayame.js に変更する
  - exports から不要な require フィールドを削除する
  - @voluntas
- [CHANGE] Vite / Oxc から Vite+ (vp) に切り替える
  - vite を @voidzero-dev/vite-plus-core に置換する
  - vite-plus を追加する
  - oxfmt / oxlint / oxlint-tsgolint を削除する (vp に統合)
  - 全スクリプトを vp コマンドに切り替える
  - defineConfig の import を vite-plus から行う
  - rollupOptions を rolldownOptions に変更する
  - minify を esbuild から oxc に変更する
  - GitHub Actions を voidzero-dev/setup-vp@v1 に切り替える
  - @voluntas
- [CHANGE] ICE disconnected 時は即座に切断しないようにする
  - failed のみ切断する
  - @voluntas
- [CHANGE] Node.js 20 のサポートを終了する
  - engines.node を >=22 に変更する
  - CI / E2E テストのマトリクスから Node.js 20 を削除する
  - @voluntas
- [CHANGE] React から Preact に切り替える
  - @voluntas
- [CHANGE] devtools の状態管理を Zustand から Preact Signals に切り替える
  - @voluntas
- [CHANGE] Biome から Oxc に切り替える
  - biome.jsonc を削除
  - .oxfmtrc.jsonc を追加
  - .oxlintrc.jsonc を追加
  - @voluntas
- [ADD] Tailwind CSS を導入する
  - @voluntas
- [ADD] DevTools に解像度を設定するオプションを追加
  - @voluntas
- [ADD] createDefaultOptions 関数を追加する
  - @voluntas
- [FIX] disconnect 後の再接続で addstream が発火しない問題を修正する
  - @voluntas
- [FIX] bye 受信時にセッションを解放し disconnect コールバックを発火する
  - @voluntas
- [FIX] DevTools で defaultOptions を直接書き換えていた問題を修正する
  - @voluntas
- [FIX] DevTools の useEffect cleanup が登録されない問題を修正する
  - @voluntas
- [FIX] setAnswer / sendOffer の例外未処理を修正する
  - @voluntas
- [FIX] glare 時に旧 RTCPeerConnection を close する
  - @voluntas
- [FIX] remoteDescription 設定前の ICE candidate をキューする
  - @voluntas
- [FIX] disconnect の二重呼び出しとコールバック重複を防ぐ
  - @voluntas
- [FIX] クローズ待ちポーリングにタイムアウトを追加する
  - @voluntas
- [FIX] audio / video の enabled が false のときメディアを追加しない
  - @voluntas
- [FIX] connect の metadataOption が null のとき authnMetadata をクリアする
  - @voluntas

## 2025.1.1

- [FIX] Ayame Web SDK のバージョンを取得できなかったのを修正する
  - @voluntas

### misc

- [ADD] Ayame Web SDK のバージョンを確認する E2E テストを追加
  - @voluntas

## 2025.1.0

- [CHANGE] `ConnectionVideoOption` の `codec` を `codecMimeType` へ変更する
  - @voluntas
- [CHANGE] `removestream` コールバックは利用されていないため廃止する
  - @voluntas
- [UPDATE] `setCodecPreferences` を利用してコーデックを指定できるようにする
  - @voluntas
- [ADD] `AyameAddStreamEvent` を追加する
  - `addstream` コールバックのイベント型を `AyameAddStreamEvent` として追加する
  - @voluntas
- [ADD] `standalone` モードに対応する
  - `options` に `standalone` を追加する
  - `standalone` モード時は、接続完了時に ayame に `type: connected` を送信する
  - `standalone` モード時は、ayame から WebSocket 接続が切断されても、ブラウザ間の接続は維持する
  - @Hexa
- [FIX] `disconnect` の処理が正常に動作しない問題を修正する
  - @voluntas

### misc

- [CHANGE] ConnectionBase を Connection へ変更する
  - @voluntas
- [CHANGE] rollup から [Vite](https://vite.dev/) へ変更
  - @voluntas
- [CHANGE] npm から [pnpm](https://pnpm.io/) に変更
  - @voluntas
- [CHANGE] eslint から [biome](https://biomejs.dev/) へ変更
  - @voluntas
- [CHANGE] prettier から [biome](https://biomejs.dev/) へ変更する
  - @voluntas
- [CHANGE] GitHub Actions の node-version を 20 と 22 にする
  - @voluntas
- [UPDATE] ubuntu-latest から ubuntu-24.04 に変更する
  - @voluntas
- [ADD] 検証用の Ayame DevTools を追加
  - @voluntas
- [ADD] Playwright と Ayame DevTools を利用した E2E テストを追加
  - @voluntas

## 2022.1

- [CHANGE] packege.json の devDependencies を最新へ追従する
  - `rollup` を `^2.66.1` へ上げる
  - `rollup-plugin-terser` を `^7.0.2` へ上げる
  - `@rollup/plugin-node-resolve` を `^13.1.3` に変更する
  - `@rollup/plugin-typescript` を `^8.3.0` に変更する
  - `typescript` を `^4.5.5` に上げる
  - `@typescript-eslint/eslint-plugin` を `^5.10.` に上げる
  - `@typescript-eslint/parse` を `^5.10.` に上げる
  - `@types/node` を `^16.11.7` へ上げる
  - `@types/webrtc` を `^0.0.31` へ上げる
  - `eslint` を `^8.8.0` に上げる
  - `eslint-config-prettier` を `^8.3.0` に上げる
  - `eslint-plugin-import` を `^2.25.4` に上げる
  - @voluntas
- [CHANGE] esdoc を削除
  - @voluntas
- [CHANGE] yarn の利用をやめ npm に切り替える
  - @voluntas
- [CHANGE] `.eslintrc.js` から `prettier/@typescript-eslint` を削除
  - @voluntas
- [CHANGE] GitHub Actions の node-version を 16 固定にする
  - @voluntas
- [CHANGE] Google STUN サーバを削除
  - @voluntas
- [CHANGE] tsconfig.json の設定を変更
  - target / module を es2020 へ変更
  - newLine を追加
  - declarationDir を追加
  - @voluntas
- [UPDATE] rollup.config.js の設定を変更
  - sourceMap を sourcemap へ変更
  - entry を削除
  - rollup-plugin-node-resolve を @rollup/plugin-node-resolve へ変更
  - rollup-plugin-typescript2 を @rollup/plugin-typescript へ変更
  - format: 'module' で mjs を出力する
  - @voluntas
- [UPDATE] GitHub Actions の actions/checkout を v2 に上げる
  - @voluntas
- [ADD] `.prettierrc.json` を追加
  - @voluntas
- [ADD] VideoCodecOption に `AV1` と `H.265` を追加
  - @voluntas
- [ADD] npm run doc コマンド追加
  - TypeDoc により apidoc/ に出力
  - @voluntas

## 2020.3

- [ADD] TypeScript の型定義ファイルを出力するようにする
  - @horiuchi

## 2020.2.1

- [ADD] ayame.min.js / ayame.js を 2020.2.1 にアップデート

## 2020.2

**DataChannel 関連で下位互換性がなくなっていますので注意してください**

- [CHANGE] addDataChannel, sendData を削除する
  - @Hexa
- [CHANGE] on('data') コールバックを削除する
  - @Hexa
- [ADD] createDataChannel を追加する
  - @Hexa
- [ADD] on('datachannel') コールバックを追加する
  - @Hexa
- [FIX] offer 側の場合のみ RTCDataChannel オブジェクトを作成するように修正する
  - @Hexa
- [CHANGE] Ayame が isExistUser を送ってくる場合のみ接続できるようにする
  - @Hexa
- [FIX] bye を受信した場合にも on('disconnect') コールバックが発火するように修正する
  - @Hexa

## 2020.1.2

- [FIX] 依存ライブラリを最新にする
  - @voluntas

## 2020.1.1

- [FIX] on('disconnect') コールバックが発火するように修正する
  - @Hexa

## 2020.1.0

**リリース番号フォーマットを変更しました**

- [FIX] 再度の接続時にオブジェクトを作成しないようにする
  - @Hexa
- [FIX] 切断時の他方の切断処理をエラーにならないように修正する
  - @Hexa
- [UPDATE] close 待ち間隔を 400ms に変更する
  - @Hexa
- [UPDATE] テストの整理
  - @Hexa
