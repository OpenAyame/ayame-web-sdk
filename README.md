# ayame-web-sdk

[![npm version](https://badge.fury.io/js/%40open-ayame%2Fayame-web-sdk.svg)](https://badge.fury.io/js/%40open-ayame%2Fayame-web-sdk)

Web SDK for WebRTC Signaling Server Ayame


## 動作確認環境

- Chrome 75.0.3770.142
- Chrome Canary 78.0.3869.0
- Safari 12.1 (14607.1.40.1.4) 
- Firefox 68.0.1

## サンプル

[OpenAyame/ayame-web-sdk-samples](https://github.com/OpenAyame/ayame-web-sdk-samples) にサンプルコードを用意しています。

## API ドキュメント

API ドキュメントは以下の URL を参照してください。

https://openayame.github.io/ayame-web-sdk/index.html

## CDN で利用する

以下のURL を

```
<script src="https://unpkg.com/@open-ayame/ayame-web-sdk@19.07.1/dist/ayame.min.js"></script>
```

のように指定すると、npm などを経由せず簡単に Ayame を利用することができます。

### unpkg

```
https://unpkg.com/@open-ayame/ayame-web-sdk@19.8.0/dist/ayame.min.js

```

### jsdelivr

```
https://cdn.jsdelivr.net/npm/@open-ayame/ayame-web-sdk@19.8.0/dist/ayame.min.js

```

### 双方向送受信接続する

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

### コーデックを H.264 指定で接続する

```javascript
const conn = Ayame.connection('wss://example.com/ws', 'test-room');
conn.options.video.codec = 'H264';
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

### datachannel でデータを送受信する

```javascript

const startConn = async () => {
  const conn = Ayame.connection('wss://example.com/ws', 'test-room');
  conn.on('data', (e) => {
      console.log('data received: ',e.data);
      });
  await conn.connect(null);
};
const sendData = (data) => {
  conn.sendData(data);
};
```
