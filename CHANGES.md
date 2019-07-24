# リリースノート

## 19.07.1
- disconnect 時の peer connection, websocket の初期化周りを修正する
- register 時に送る roomId, clientId を camelCase に変更する
- connect 時に第二引数で authnMetadata を送信できるようにする
- on('connect') コールバックで authzMetadata を受け取るようにする

## 0.0.1.rc-1

**ファーストリリース**

- Ayame.connection / connect で Ayame に接続できるようにする
