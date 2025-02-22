import type React from 'react'
import { useStore } from '../store/useStore'

const DisconnectButton: React.FC = () => {
  const ayameConnection = useStore((state) => state.ayame.connection)

  const localMediaStream = useStore((state) => state.mediaStream.local)

  const setAyameConnection = useStore((state) => state.setAyameConnection)
  const setLocalMediaStream = useStore((state) => state.setLocalMediaStream)
  const setRemoteMediaStream = useStore((state) => state.setRemoteMediaStream)

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
    <button data-testid="disconnect" type="button" onClick={handleClick}>
      Disconnect
    </button>
  )
}

export default DisconnectButton
