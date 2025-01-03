import type React from 'react'
import { SignalingUrl } from './SignalingUrl'

const ConnectionSettings: React.FC = () => {
  return (
    <fieldset style={{ maxWidth: '500px' }}>
      <legend>Connection settings</legend>
      <p>
        Signaling URL:
        <SignalingUrl />
      </p>
    </fieldset>
  )
}

export default ConnectionSettings
