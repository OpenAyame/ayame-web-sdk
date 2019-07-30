const signalingUrl = 'wss://ayame.shiguredo.jp/ws';
let roomId = 'ayame-test-room';
let clientId = null;

// query string から roomId, clientId を取得するヘルパー
function parseQueryString() {
  const qs = window.Qs;
  if (window.location.search.length > 0) {
    var params = qs.parse(window.location.search.substr(1));
    if (params.roomId) {
      roomId = params.roomId;
    }
    if (params.clientId) {
      clientId = params.clientId;
    }
  }
}

parseQueryString();

