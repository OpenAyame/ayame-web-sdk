# 動作確認について

## 動作確認

### 準備

- 簡単な HTTP サーバを用意します
  - dist と test 以下にアクセスできるように設定して起動させます
- ayame-web-sdk に変更がない場合は、dist/ayame.js はそのまま使用可能です
- ayame-web-sdk に変更を入れた場合は、yarn build を実行して、dist/ayame.js を更新します
- シグナリングサーバの Ayame を別途使用する場合は、test/main.js の signalingUrl をその Ayame の URL に変更します

### 確認内容

test/ 以下の HTML ファイルごとに動作を確認します。

- sendrecv.html
  - 動画の送受信
    - 2 つの sendrecv.html 間で動画を送受信できること
- recvonly.html
  - 動画の受信
    - sendonly.html からの送信動画を受信できること
- sendonly.html
  - 動画の送信
    - recvonly.html で送信動画を受信できること
- qs.html
  - Query String で roomId, clientId, signalingKey を指定した映像の送受信
    - Ayame Lite に接続した場合は、roomId, clientId, signalingKey を指定して 2 つの qs.html 間で動画が送受信できること
    - 別途用意した Ayame に直接接続させる場合は、roomId, clientId を指定して 2 つの qs.html 間で動画が送受信できること
- datachannel.html
  - DataChannel による接続と送受信
    - 2 つの datachannel.html 間でメッセージの送受信ができること
- multi_datachannel.html
  - DataChannel による接続と、複数 label による送受信
    - 2 つの multi_datachannel.html 間でメッセージ A,  メッセージ B のそれぞれのメッセージが送受信できること
