import { createConnection, defaultOptions } from '@open-ayame/ayame-web-sdk'
import type { AyameAddStreamEvent } from '@open-ayame/ayame-web-sdk'
import { useStore } from '../store/useStore'

import type React from 'react'
const ConnectButton: React.FC = () => {
  const audioEnabled = useStore((state) => state.settings.audio.isEnable)
  const audioDirection = useStore((state) => state.settings.audio.direction)
  const videoEnabled = useStore((state) => state.settings.video.isEnable)
  const videoDirection = useStore((state) => state.settings.video.direction)

  const signalingUrl = useStore((state) => state.settings.signalingUrl)
  const roomId = useStore((state) => state.settings.roomId)
  const debug = useStore((state) => state.settings.debug)
  const signalingKey = useStore((state) => state.settings.signalingKey)

  const setAyameConnection = useStore((state) => state.setAyameConnection)
  const setLocalMediaStream = useStore((state) => state.setLocalMediaStream)
  const setRemoteMediaStream = useStore((state) => state.setRemoteMediaStream)
  const setAyameConnectionState = useStore((state) => state.setAyameConnectionState)

  const handleClick = async () => {
    const options = defaultOptions
    options.audio.enabled = audioEnabled
    options.audio.direction = audioDirection
    options.video.enabled = videoEnabled
    options.video.direction = videoDirection
    options.signalingKey = signalingKey

    const conn = createConnection(signalingUrl, roomId, options, debug)

    let localStream: MediaStream | null = null

    if (
      (audioEnabled && audioDirection !== 'recvonly') ||
      (videoEnabled && videoDirection !== 'recvonly')
    ) {
      localStream = await navigator.mediaDevices.getUserMedia({
        audio: audioEnabled,
        video: videoEnabled,
      })
      setLocalMediaStream(localStream)
    }

    conn.on('addstream', (event: AyameAddStreamEvent) => {
      setRemoteMediaStream(event.stream)
    })

    conn.on('open', () => {
      const pc = conn.peerConnection
      if (!pc) {
        return
      }
      pc.onconnectionstatechange = (event) => {
        setAyameConnectionState(pc.connectionState)
      }
    })

    // 切断時にローカルとリモートのメディアストリームを停止する
    conn.on('disconnect', () => {
      // この関数内で取得した localStream を停止する
      // store を経由しないようにする
      if (localStream) {
        for (const track of localStream.getTracks()) {
          track.stop()
        }
      }

      setLocalMediaStream(null)
      setRemoteMediaStream(null)
      setAyameConnection(null)
    })

    await conn.connect(localStream)

    setAyameConnection(conn)
  }

  return (
    <button data-testid="connect" type="button" onClick={handleClick}>
      Connect
    </button>
  )
}

export default ConnectButton
