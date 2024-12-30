import { createConnection, defaultOptions, getAvailableCodecs } from '@open-ayame/ayame-web-sdk'
import type { Connection, ConnectionOptions, Direction } from '@open-ayame/ayame-web-sdk'
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

  // チェックボックスを取得する
  const audioElement = document.getElementById('audio') as HTMLInputElement
  const audioDirectionElement = document.getElementById('audio-direction') as HTMLSelectElement

  const audioCodecMimeTypeElement = document.getElementById(
    'audio-codec-mime-type',
  ) as HTMLSelectElement
  if (!audioCodecMimeTypeElement) {
    return
  }

  const availableAudioCodecs = getAvailableCodecs('audio', 'sender')
  for (const codec of availableAudioCodecs) {
    const option = document.createElement('option')
    option.value = codec
    option.textContent = codec
    audioCodecMimeTypeElement.appendChild(option)
  }

  const videoElement = document.getElementById('video') as HTMLInputElement
  const videoDirectionElement = document.getElementById('video-direction') as HTMLSelectElement
  const videoCodecMimeTypeElement = document.getElementById(
    'video-codec-mime-type',
  ) as HTMLSelectElement
  if (!videoCodecMimeTypeElement) {
    return
  }

  // getAvailableVideoCodecs で取得したコーデックをセレクトボックスに設定する
  // 送受信なので Direction.Sendrecv を渡す
  const availableVideoCodecs = getAvailableCodecs('video', 'sender')
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
      options.audio.enabled = audioElement.checked
      options.audio.direction = audioDirectionElement.value as Direction
      options.video.enabled = videoElement.checked
      options.video.direction = videoDirectionElement.value as Direction
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

    let stream: MediaStream | null = null

    // audio が有効かつ sendrecv または sendonly の場合はローカルの音声を取得する
    const audioEnabled =
      options.audio.enabled &&
      (options.audio.direction === 'sendrecv' || options.audio.direction === 'sendonly')
    // video が有効かつ sendrecv または sendonly の場合はローカルの映像を取得する
    const videoEnabled =
      options.video.enabled &&
      (options.video.direction === 'sendrecv' || options.video.direction === 'sendonly')

    if (audioEnabled || videoEnabled) {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: audioEnabled,
        video: videoEnabled,
      })
    }

    // stream が取得できたら local-video に設定する
    if (stream) {
      const localVideo = document.getElementById('local-video') as HTMLVideoElement
      if (!localVideo) {
        return
      }
      localVideo.srcObject = stream
    }

    conn.on('addstream', (event) => {
      const remoteVideo = document.getElementById('remote-video') as HTMLVideoElement
      if (!remoteVideo) {
        return
      }
      console.debug('addstream', event)
      remoteVideo.srcObject = event.stream
    })

    conn.on('removestream', (event) => {
      const remoteVideo = document.getElementById('remote-video') as HTMLVideoElement
      if (!remoteVideo) {
        return
      }
      console.debug('removestream', event)
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
