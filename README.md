# ayame-web-sdk

[![npm version](https://badge.fury.io/js/%40open-ayame%2Fayame-web-sdk.svg)](https://badge.fury.io/js/%40open-ayame%2Fayame-web-sdk)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Actions Status](https://github.com/OpenAyame/ayame-web-sdk/workflows/Lint%20And%20Flow%20Test/badge.svg)](https://github.com/OpenAyame/ayame-web-sdk/actions)

Web SDK for WebRTC Signaling Server Ayame

## About Shiguredo's open source software

We will not respond to PRs or issues that have not been discussed on Discord. Also, Discord is only available in Japanese.

Please read <https://github.com/shiguredo/oss> before use.

## 時雨堂のオープンソースソフトウェアについて

利用前に <https://github.com/shiguredo/oss> をお読みください。

## 既知の問題

- Chrome と Edge 124 以降ではコーデック指定が正常に動作しません
  - 将来的にコーデック指定を削除予定です
  - <https://groups.google.com/g/discuss-webrtc/c/QS7y-7zR5ok/m/2htOnnHRAQAJ>
  - <https://github.com/webrtc/samples/pull/1640>

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

<https://openayame.github.io/ayame-web-sdk/index.html>

## CDN で利用する

以下のURL を

```html
<script src="https://unpkg.com/@open-ayame/ayame-web-sdk@2022.1.0/dist/ayame.min.js"></script>
```

のように指定すると、npm などを経由せず簡単に Ayame を利用することができます。

### unpkg

<https://unpkg.com/@open-ayame/ayame-web-sdk@2022.1.0/dist/ayame.min.js>

### jsdelivr

<https://cdn.jsdelivr.net/npm/@open-ayame/ayame-web-sdk@2022.1.0/dist/ayame.min.js>

### 双方向送受信接続する

- [オンラインサンプル](https://openayame.github.io/ayame-web-sdk-samples/sendrecv.html)

```javascript
const conn = Ayame.connection("wss://example.com/ws", "test-room");
const startConn = async () => {
  const mediaStream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true,
  });
  await conn.connect(mediaStream);
  conn.on("disconnect", (e) => console.log(e));
  conn.on("addstream", (e) => {
    document.querySelector("#remote-video").srcObject = e.stream;
  });
  document.querySelector("#local-video").srcObject = mediaStream;
};
startConn();
```

### 送信のみ(sendonly) で接続する

- [オンラインサンプル](https://openayame.github.io/ayame-web-sdk-samples/sendonly.html)

```javascript
const conn = Ayame.connection("wss://example.com/ws", "test-room");
conn.options.video.direction = "sendonly";
conn.options.audio.direction = "sendonly";
const startConn = async () => {
  const mediaStream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true,
  });
  await conn.connect(mediaStream);
  conn.on("disconnect", (e) => console.log(e));
  conn.on("addstream", (e) => {
    document.querySelector("#remote-video").srcObject = e.stream;
  });
  document.querySelector("#local-video").srcObject = mediaStream;
};
startConn();
```

### 受信のみ(recvonly) で接続する

- [オンラインサンプル](https://openayame.github.io/ayame-web-sdk-samples/recvonly.html)

```javascript
const conn = Ayame.connection("wss://example.com/ws", "test-room");
conn.options.video.direction = "recvonly";
conn.options.audio.direction = "recvonly";
const startConn = async () => {
  await conn.connect(null);
  conn.on("disconnect", (e) => console.log(e));
  conn.on("addstream", (e) => {
    document.querySelector("#remote-video").srcObject = e.stream;
  });
};
startConn();
```

### datachannel でデータを送受信する

- [オンラインサンプル](https://openayame.github.io/ayame-web-sdk-samples/datachannel.html)

```javascript
let dataChannel = null;
const startConn = async () => {
  const conn = Ayame.connection("wss://example.com/ws", "test-room");
  conn.on("open", async (e) => {
    dataChannel = await conn.createDataChannel("dataChannel");
    dataChannel.onmessage = (e) => {
      console.log("data received: ", e.data);
    };
  });
  await conn.connect(null);
};
startConn();

const sendData = (data) => {
  dataChannel.send(data);
};
```

## ライセンス

Apache License 2.0

```text
Copyright 2019-2022, Shiguredo Inc.
Copyright 2019, Kyoko Kadowaki aka kdxu (Original Author)

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
