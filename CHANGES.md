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

- [CHANGE] packege.json の devDependencies を最新へ追従する
    - `rollup` を `^2.66.1` へ上げる
    - `rollup-plugin-terser` を `^7.0.2` へ上げる
    - `rollup-plugin-node-resolve` を `@rollup/plugin-node-resolve` `^13.1.3` に切り替える
    - `rollup-plugin-typescript2` を `@rollup/plugin-typescript` `^8.3.0` に切り替える
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

- [ADD] TypeScriptの型定義ファイルを出力するようにする
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
