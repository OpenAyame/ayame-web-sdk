# リリースノート

- UPDATE
    - 下位互換がある変更
- ADD
    - 下位互換がある追加
- CHANGE
    - 下位互換のない変更
- FIX
    - バグ修正

## develop

- [FIX] 切断時の他方の切断処理をエラーにならないように修正する
- [UPDATE] close 待ち間隔を 400ms に変更する

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
