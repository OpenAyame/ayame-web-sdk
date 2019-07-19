# ayame-web-sdk

[![npm version](https://badge.fury.io/js/%40open-ayame%2Fayame-web-sdk.svg)](https://badge.fury.io/js/%40open-ayame%2Fayame-web-sdk)

Web SDK for WebRTC Signaling Server Ayame

## サンプル

- [sendrecv(双方向送受信)](./samples/sendrecv.html)
- [recvonly(受信のみ)](./samples/recvonly.html)
- [sendonly(送信のみ)](./samples/sendonly.html)
- [getDisplayMedia(画面共有)](./samples/displaymedia.html)

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
