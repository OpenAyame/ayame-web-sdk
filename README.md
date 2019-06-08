# ayame-web-sdk

Web SDK for WebRTC Signaling Server Ayame

## サンプル

```javascript
const conn = Ayame.connection('wss://example.com:3000/ws', 'test-room');
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
