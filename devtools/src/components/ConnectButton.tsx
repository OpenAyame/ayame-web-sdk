import { createConnection, defaultOptions } from '@open-ayame/ayame-web-sdk'
import type { AyameAddStreamEvent } from '@open-ayame/ayame-web-sdk'
import { useAyameStore } from '../store/useAyameStore'
import { useSettingsStore } from '../store/useSettingsStore'

import type React from 'react'
const ConnectButton: React.FC = () => {
  const audioEnabled = useSettingsStore((state) => state.settings.audio.isEnable)
  const audioDirection = useSettingsStore((state) => state.settings.audio.direction)
  const videoEnabled = useSettingsStore((state) => state.settings.video.isEnable)
  const videoDirection = useSettingsStore((state) => state.settings.video.direction)

  const signalingUrl = useSettingsStore((state) => state.settings.signalingUrl)
  const roomId = useSettingsStore((state) => state.settings.roomId)
  const debug = useSettingsStore((state) => state.settings.debug)
  const signalingKey = useSettingsStore((state) => state.settings.signalingKey)

  const setAyameConnection = useAyameStore((state) => state.setAyameConnection)
  const setLocalMediaStream = useAyameStore((state) => state.setLocalMediaStream)
  const setRemoteMediaStream = useAyameStore((state) => state.setRemoteMediaStream)
  const setConnectionState = useAyameStore((state) => state.setConnectionState)

  const localMediaStream = useAyameStore((state) => state.localMediaStream)
  const remoteMediaStream = useAyameStore((state) => state.remoteMediaStream)

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
        setConnectionState(pc.connectionState)
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
