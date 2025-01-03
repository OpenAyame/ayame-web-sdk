import type React from 'react'
import { useAyameStore } from '../store/useAyameStore'

const DisconnectButton: React.FC = () => {
  const ayameConnection = useAyameStore((state) => state.ayameConnection)

  const localMediaStream = useAyameStore((state) => state.localMediaStream)
  const remoteMediaStream = useAyameStore((state) => state.remoteMediaStream)

  const setAyameConnection = useAyameStore((state) => state.setAyameConnection)
  const setLocalMediaStream = useAyameStore((state) => state.setLocalMediaStream)
  const setRemoteMediaStream = useAyameStore((state) => state.setRemoteMediaStream)

  const handleClick = async () => {
    if (!ayameConnection) {
      return
    }

    if (localMediaStream) {
      for (const track of localMediaStream.getTracks()) {
        track.stop()
      }
    }

    await ayameConnection.disconnect()

    setLocalMediaStream(null)
    setRemoteMediaStream(null)

    // ayameConnection を null にする
    setAyameConnection(null)
  }

  return (
    <button id="disconnect" type="button" onClick={handleClick}>
      Disconnect
    </button>
  )
}

export default DisconnectButton
