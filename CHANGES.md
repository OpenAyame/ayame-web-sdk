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
- [CHANGE] audio のコーデック指定をなくす
- [ADD] video, audio のコーデック指定をサポートする
- [UPDATE] webpack から rollupjs に変更する

## 19.07.1

**ファーストリリースは Ayame 19.07.1 にバージョン番号を揃えています**

- [CHANGE] register 時に送る roomId, clientId を camelCase に変更する
- [ADD] connect 時に第二引数で authnMetadata を送信できるようにする
- [ADD] on('connect') コールバックで authzMetadata を受け取るようにする
- [FIX] disconnect 時の peer connection, websocket の初期化周りを修正する
