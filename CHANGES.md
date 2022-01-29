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

- [CHANGE] esdoc を削除
    - 今後は TypeDoc へ移行予定
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
- [UPDATE] `@types/node` を `^16.11.7` へ上げる
    - @voluntas
- [UPDATE] `@types/webrtc` を `^0.0.31` へ上げる
    - @voluntas
- [UPDATE] `rollup` を `^2.66.1` へ上げる
    - @voluntas
- [UPDATE] `rollup-plugin-node-resolve` を `^13.1.3` へ上げる
    - @voluntas
- [UPDATE] `rollup-plugin-terser` を `^7.0.2` へ上げる
    - @voluntas
- [UPDATE] `rollup-plugin-typescript2` を `^0.31.1` へ上げる
    - @voluntas
- [UPDATE] `typescript` を `^4.5.5` に上げる
    - @voluntas
- [ADD] `.prettierrc.json` を追加
    - @voluntas
- [ADD] VideoCodecOption に `AV1` と `H.265` を追加
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

## 19.12.0

- [UPDATE] authnMetadata, authzMetadata を any にする
    - @Hexa
- [UPDATE] 不要な依存パッケージを削除
    - `@babel/core`
    - @kdxu
- [UPDATE] 依存パッケージのバージョンを更新する
    - @types/node                       ^12.7.8  →  ^12.12.14
    - @typescript-eslint/eslint-plugin   ^2.3.1  →     ^2.9.0
    - @typescript-eslint/parser          ^2.3.1  →     ^2.9.0
    - eslint                             ^6.5.0  →     ^6.7.2
    - eslint-config-prettier             ^6.3.0  →     ^6.7.0
    - prettier                          ^1.18.2  →    ^1.19.1
    - rollup                            ^1.22.0  →    ^1.27.6
    - rollup-plugin-typescript2         ^0.24.3  →    ^0.25.2
    - typescript                         ^3.6.3  →     ^3.7.2
    - @kdxu
- [UPDATE] query string の signalingKey を設定できるようにする
    - @Hexa
- [FIX] video コーデックを指定しなかった場合のコーデックを VP9 からブラウザデフォルトに変更する
    - @Hexa
- [FIX] datachannel の label を channelId から label に変更する
    - @Hexa
- [FIX] 接続時の label 固定の datachannel の追加処理を削除する
    - @Hexa
- [FIX] isExistUser が true の場合のみ offer メッセージを送るようにする & peerconnection の生成を一回にする
    - @kdxu
- [FIX] 使用されていない MetadataOption の key を削除する
    - @Hexa
- [FIX] query string に client_id がない場合は接続に失敗させる
    - @Hexa
- [FIX] type: bye に対応する
    - 現時点で Ayame が bye を送ってこないため利用はされない
    - @Hexa

## 19.09.0

- [CHANGE] flow -> typescript に変更する
- [ADD] isRelay オプションを追加する。iceTransportPolicy を強制的に 'relay' にできるようにした
- [CHANGE] signaling key を ConnectionOptions に追加するよう変更する

## 19.08.0

- [UPDATE] register 時に iceServers の値を server 経由で設定できるようにする
- [CHANGE] signaling key を指定できるようにする
- [ADD] datachannel に対応する
- [CHANGE] onconnect コールバックを signalingState が connected になったときに呼ぶ
- [FIX] Safari 対応 (SDP 書き換えも含む)
- [CHANGE] audio のコーデック指定をなくす
- [ADD] video, audio のコーデック指定をサポートする
- [UPDATE] webpack から rollupjs に変更する

## 19.07.1

**ファーストリリースは Ayame 19.07.1 にバージョン番号を揃えています**

- [CHANGE] register 時に送る roomId, clientId を camelCase に変更する
- [ADD] connect 時に第二引数で authnMetadata を送信できるようにする
- [ADD] on('connect') コールバックで authzMetadata を受け取るようにする
- [FIX] disconnect 時の peer connection, websocket の初期化周りを修正する
