import type React from 'react'
import { useAyameStore } from '../store/useAyameStore'

const DisconnectButton: React.FC = () => {
  const ayameConnection = useAyameStore((state) => state.ayameConnection)
  const setAyameConnection = useAyameStore((state) => state.setAyameConnection)
  const setLocalMediaStream = useAyameStore((state) => state.setLocalMediaStream)
  const setRemoteMediaStream = useAyameStore((state) => state.setRemoteMediaStream)

  const handleClick = () => {
    if (!ayameConnection) {
      return
    }
    ayameConnection.disconnect()

    // ayameConnection を null にする
    setAyameConnection(null)

    // ここで LocalVideo と RemoteVideo の srcObject を null にする
    setLocalMediaStream(null)
    setRemoteMediaStream(null)
  }

  return (
    <button type="button" onClick={handleClick}>
      Disconnect
    </button>
  )
}

export default DisconnectButton
