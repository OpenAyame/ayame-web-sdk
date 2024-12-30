import {
  Direction,
  createConnection,
  defaultOptions,
  getAvailableVideoCodecs,
} from '@open-ayame/ayame-web-sdk'
import type { Connection, ConnectionOptions } from '@open-ayame/ayame-web-sdk'
import queryString from 'query-string'

document.addEventListener('DOMContentLoaded', () => {
  const signalingUrl = import.meta.env.VITE_AYAME_SIGNALING_URL
  const roomId = import.meta.env.VITE_AYAME_ROOM_ID
  const signalingKey = import.meta.env.VITE_AYAME_SIGNALING_KEY

  // ここで roomId を設定する
  const roomIdElement = document.getElementById('room-id') as HTMLInputElement
  if (!roomIdElement) {
    return
  }
  roomIdElement.value = roomId

  // ここで clientId を設定する
  const clientIdElement = document.getElementById('client-id') as HTMLInputElement
  if (!clientIdElement) {
    return
  }
  clientIdElement.value = crypto.randomUUID()

  const videoCodecMimeTypeElement = document.getElementById(
    'video-codec-mime-type',
  ) as HTMLSelectElement
  if (!videoCodecMimeTypeElement) {
    return
  }

  // getAvailableVideoCodecs で取得したコーデックをセレクトボックスに設定する
  // 送受信なので Direction.Sendrecv を渡す
  const availableVideoCodecs = getAvailableVideoCodecs(Direction.Sendrecv)
  for (const codec of availableVideoCodecs) {
    const option = document.createElement('option')
    option.value = codec
    option.textContent = codec
    videoCodecMimeTypeElement.appendChild(option)
  }

  // qs の videoCodecMimeType の値が select の value でマッチするモノがあったら切り替える
  const videoCodecMimeType = queryString.parse(location.search).videoCodecMimeType
  if (videoCodecMimeType && typeof videoCodecMimeType === 'string') {
    const videoCodecMimeTypeElement = document.getElementById(
      'video-codec-mime-type',
    ) as HTMLSelectElement
    if (!videoCodecMimeTypeElement) {
      return
    }
    // セレクトボックスの値を更新
    videoCodecMimeTypeElement.value = videoCodecMimeType
  }

  const standaloneElement = document.getElementById('standalone') as HTMLInputElement
  if (!standaloneElement) {
    return
  }
  const standalone = standaloneElement.checked

  let conn: Connection | null = null

  // connect ボタンを押す
  document.querySelector('#connect')?.addEventListener('click', async () => {
    console.debug('connect button clicked')

    const options: ConnectionOptions = defaultOptions
    if (signalingKey) {
      options.signalingKey = signalingKey
      options.standalone = standalone
      options.clientId = clientIdElement.value
    }

    // セレクトボックスの値を取得する
    const videoCodecMimeTypeElement = document.getElementById(
      'video-codec-mime-type',
    ) as HTMLSelectElement
    const videoCodecMimeType = videoCodecMimeTypeElement.value
    if (videoCodecMimeType !== 'undefined') {
      options.video.codecMimeType = videoCodecMimeType
    }

    // createConnection に変更する
    conn = createConnection(signalingUrl, roomId, options, true)

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: options.audio.enabled,
      video: options.video.enabled,
    })

    const localVideo = document.getElementById('local-video') as HTMLVideoElement
    if (!localVideo) {
      return
    }
    localVideo.srcObject = stream

    conn.on('addstream', (event) => {
      const remoteVideo = document.getElementById('remote-video') as HTMLVideoElement
      if (!remoteVideo) {
        return
      }
      remoteVideo.srcObject = event.stream
    })

    conn.on('removestream', (event) => {
      const remoteVideo = document.getElementById('remote-video') as HTMLVideoElement
      if (!remoteVideo) {
        return
      }
      remoteVideo.srcObject = null
    })

    await conn.connect(stream)
  })

  document.querySelector('#disconnect')?.addEventListener('click', async () => {
    if (!conn) {
      return
    }
    console.debug('disconnecting...')
    await conn.disconnect()
    console.debug('disconnected')
    conn = null
  })
})
