const signalingUrl = 'wss://ayame-labo.shiguredo.jp/signaling'
let roomId = 'ayame-test-sdk'
let clientId = null
let videoCodec = null
const messages = ''
let signalingKey = null
let standalone = false

function onChangeVideoCodec() {
  videoCodec = document.getElementById('video-codec').value
  if (videoCodec === 'none') {
    videoCodec = null
  }
}

function onChangeStandaloneMode() {
  standalone = document.getElementById('standaloneInput').checked
}

// query string から roomId, clientId を取得するヘルパー
function parseQueryString() {
  const qs = window.Qs
  if (window.location.search.length > 0) {
    const params = qs.parse(window.location.search.slice(1))
    if (params.roomId) {
      roomId = params.roomId
    }
    if (params.clientId) {
      clientId = params.clientId
    }
    if (params.signalingKey) {
      signalingKey = params.signalingKey
    }
  }
}

parseQueryString()
