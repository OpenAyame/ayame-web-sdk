# ayame-web-sdk

[![npm version](https://badge.fury.io/js/%40open-ayame%2Fayame-web-sdk.svg)](https://badge.fury.io/js/%40open-ayame%2Fayame-web-sdk)

Web SDK for WebRTC Signaling Server Ayame

## サンプル

[OpenAyame/ayame-web-sdk-samples](https://github.com/OpenAyame/ayame-web-sdk-samples) にサンプルコードを用意しています。

## CDN で利用する

以下のURL を

```
<script src="https://unpkg.com/@open-ayame/ayame-web-sdk@0.0.1-rc10/dist/ayame.min.js"></script>
```

のように指定すると、npm などを経由せず簡単に Ayame を利用することができます。

### unpkg

```
https://unpkg.com/@open-ayame/ayame-web-sdk@0.0.1-rc10/dist/ayame.min.js

```

### jsdelivr

```
https://cdn.jsdelivr.net/npm/@open-ayame/ayame-web-sdk@0.0.1-rc10/dist/ayame.min.js

```

### 双方向送受信接続する

```javascript
const conn = Ayame.connection('wss://example.com/ws', 'test-room');
const startConn = async () => {
    const mediaStream = await navigator.mediaDevices.getUserMedia({audio: true, video: true});
    const stream = await conn.connect(mediaStream);
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
conn.options.audio.direction = 'sendonly';
conn.options.audio.direction = 'sendonly';
const startConn = async () => {
    const mediaStream = await navigator.mediaDevices.getUserMedia({audio: true, video: true});
    const stream = await conn.connect(mediaStream);
    conn.on('disconnect', (e) => console.log(e));
    conn.on('addstream', (e) => {
        document.querySelector('#remote-video').srcObject = e.stream;
    });
    document.querySelector('#local-video').srcObject = stream;
};
startConn();
```


### 受信のみ(recvonly) で接続する

```javascript
const conn = Ayame.connection('wss://example.com/ws', 'test-room');
conn.options.audio.direction = 'recvonly';
conn.options.audio.direction = 'recvonly';
const startConn = async () => {
    const mediaStream = await navigator.mediaDevices.getUserMedia({audio: true, video: true});
    const stream = await conn.connect(mediaStream);
    conn.on('disconnect', (e) => console.log(e));
    conn.on('addstream', (e) => {
        document.querySelector('#remote-video').srcObject = e.stream;
    });
    document.querySelector('#local-video').srcObject = stream;
};
startConn();
```
