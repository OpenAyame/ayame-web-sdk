import { connection, defaultOptions } from '@open-ayame/ayame-web-sdk'
import type { Connection, ConnectionOptions } from '@open-ayame/ayame-web-sdk'

document.addEventListener('DOMContentLoaded', () => {
  const signalingUrl = import.meta.env.VITE_AYAME_SIGNALING_URL
  const roomId = import.meta.env.VITE_AYAME_ROOM_ID
  const clientId = import.meta.env.VITE_AYAME_CLIENT_ID
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
  clientIdElement.value = clientId

  const videoCodecMimeTypeElement = document.getElementById(
    'video-codec-mime-type',
  ) as HTMLSelectElement
  if (!videoCodecMimeTypeElement) {
    return
  }

  // getAvailableVideoCodecs で取得したコーデックをセレクトボックスに設定する
  // getAvailableVideoCodecs は Ayame.getAvailableVideoCodecs で呼べるようにしたい
  const availableVideoCodecs = getAvailableVideoCodecs()
  for (const codec of availableVideoCodecs) {
    const option = document.createElement('option')
    option.value = codec
    option.textContent = codec
    videoCodecMimeTypeElement.appendChild(option)
  }

  const conn: Connection | null = null

  // connect ボタンを押す
  document.querySelector('#connect')?.addEventListener('click', async () => {
    console.log('connect button clicked')

    const options: ConnectionOptions = defaultOptions
    if (signalingKey) {
      options.signalingKey = signalingKey
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
    const conn = connection(signalingUrl, roomId, options)

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

  document.querySelector('#disconnect')?.addEventListener('click', () => {
    console.log('disconnect')
  })
})

// 対応
export const getAvailableVideoCodecs = (): string[] => {
  if (typeof RTCRtpSender === 'undefined') {
    return []
  }

  if (typeof RTCRtpSender.getCapabilities !== 'function') {
    return []
  }

  const codecs = RTCRtpSender.getCapabilities('video')?.codecs
  if (!codecs) {
    return []
  }

  return (
    codecs
      .filter((c) => {
        // mimeType は insensitive-case なので lowerCase に変換する
        const videoCodecType = c.mimeType.toLowerCase()

        // rtx/red/ulpfec はフィルターとして削除する
        if (
          videoCodecType === 'video/rtx' ||
          videoCodecType === 'video/red' ||
          videoCodecType === 'video/ulpfec'
        ) {
          return false
        }

        return true
      })
      // mimeType が既に存在している場合は重複を削除する
      .filter((c, index, self) => index === self.findIndex((t) => t.mimeType === c.mimeType))
      .map((c) => c.mimeType)
      .sort()
  )
}
