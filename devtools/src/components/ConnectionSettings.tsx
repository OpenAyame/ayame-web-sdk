import type React from 'react'
import ClientId from './ClientId'
import DebugToggle from './DebugToggle'
import RoomId from './RoomId'
import SignalingKey from './SignalingKey'
import SignalingUrl from './SignalingUrl'
import StandaloneToggle from './StandaloneToggle'

const ConnectionSettings: React.FC = () => {
  return (
    <fieldset style={{ maxWidth: '500px' }}>
      <legend>Connection settings</legend>
      <p>
        Signaling URL:
        <SignalingUrl />
      </p>
      <p>
        Room ID:
        <RoomId />
      </p>
      <p>
        Client ID:
        <ClientId />
      </p>
      <p>
        Signaling Key:
        <SignalingKey />
      </p>
      <p>
        Debug:
        <DebugToggle />
      </p>
      <p>
        Standalone:
        <StandaloneToggle />
      </p>
    </fieldset>
  )
}

export default ConnectionSettings
