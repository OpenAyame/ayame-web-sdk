# ayame-web-sdk

[![npm version](https://badge.fury.io/js/%40open-ayame%2Fayame-web-sdk.svg)](https://badge.fury.io/js/%40open-ayame%2Fayame-web-sdk)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Actions Status](https://github.com/OpenAyame/ayame-web-sdk/workflows/Lint%20And%20Flow%20Test/badge.svg)](https://github.com/OpenAyame/ayame-web-sdk/actions)

Web SDK for WebRTC Signaling Server Ayame

## 動作環境

**最新版を利用してください**

- Google Chrome
- Apple Safari
- Mozilla Firefox
- Microsoft Edge

## サンプル

[OpenAyame/ayame-web-sdk-samples](https://github.com/OpenAyame/ayame-web-sdk-samples) にサンプルコードを用意しています。

## API ドキュメント

API ドキュメントは以下の URL を参照してください。

https://openayame.github.io/ayame-web-sdk/index.html

## CDN で利用する

以下のURL を

```
<script src="https://unpkg.com/@open-ayame/ayame-web-sdk@2020.1.1/dist/ayame.min.js"></script>
```

のように指定すると、npm などを経由せず簡単に Ayame を利用することができます。

### unpkg

```
https://unpkg.com/@open-ayame/ayame-web-sdk@2020.1.1/dist/ayame.min.js
```

### jsdelivr

```
https://cdn.jsdelivr.net/npm/@open-ayame/ayame-web-sdk@2020.1.1/dist/ayame.min.js
```

### 双方向送受信接続する

- [オンラインサンプル](https://openayame.github.io/ayame-web-sdk-samples/sendrecv.html)

```javascript
const conn = Ayame.connection('wss://example.com/ws', 'test-room');
const startConn = async () => {
    const mediaStream = await navigator.mediaDevices.getUserMedia({audio: true, video: true});
    await conn.connect(mediaStream);
    conn.on('disconnect', (e) => console.log(e));
    conn.on('addstream', (e) => {
        document.querySelector('#remote-video').srcObject = e.stream;
    });
    document.querySelector('#local-video').srcObject = stream;
};
startConn();
```


### 送信のみ(sendonly) で接続する

- [オンラインサンプル](https://openayame.github.io/ayame-web-sdk-samples/sendonly.html)

```javascript
const conn = Ayame.connection('wss://example.com/ws', 'test-room');
conn.options.video.direction = 'sendonly';
conn.options.audio.direction = 'sendonly';
const startConn = async () => {
    const mediaStream = await navigator.mediaDevices.getUserMedia({audio: true, video: true});
    await conn.connect(mediaStream);
    conn.on('disconnect', (e) => console.log(e));
    conn.on('addstream', (e) => {
        document.querySelector('#remote-video').srcObject = e.stream;
    });
    document.querySelector('#local-video').srcObject = mediaStream;
};
startConn();
```


### 受信のみ(recvonly) で接続する

- [オンラインサンプル](https://openayame.github.io/ayame-web-sdk-samples/recvonly.html)

```javascript
const conn = Ayame.connection('wss://example.com/ws', 'test-room');
conn.options.video.direction = 'recvonly';
conn.options.audio.direction = 'recvonly';
const startConn = async () => {
    await conn.connect(null);
    conn.on('disconnect', (e) => console.log(e));
    conn.on('addstream', (e) => {
        document.querySelector('#remote-video').srcObject = e.stream;
    });
};
startConn();
```

### datachannel でデータを送受信する


- [オンラインサンプル](https://openayame.github.io/ayame-web-sdk-samples/datachannel.html)

```javascript

const startConn = async () => {
  const conn = Ayame.connection('wss://example.com/ws', 'test-room');
  conn.on('open', (e) => {
      conn.addDataChannel('dataChannel');
  });
  conn.on('data', (e) => {
      console.log('data received: ',e.data);
      });
  await conn.connect(null);
};
const sendData = (data) => {
  conn.sendData(data);
};
```

## ライセンス

Apache License 2.0

```
Copyright 2019, Kyoko Kadowaki aka kdxu (Original Author)
Copyright 2019-2020, Shiguredo Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

## 開発について

Ayame Web SDK はオープンソースソフトウェアですが、開発についてはオープンではありません。
そのためコメントやプルリクエストを頂いてもすぐには採用はしません。

まずは Discord にてご連絡ください。

## Discord

ベストエフォートで運用しています。

https://discord.gg/mDesh2E
