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

  const conn: Connection | null = null

  // connect ボタンを押す
  document.querySelector('#connect')?.addEventListener('click', async () => {
    console.log('connect button clicked')

    const options: ConnectionOptions = defaultOptions
    if (signalingKey) {
      options.signalingKey = signalingKey
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
