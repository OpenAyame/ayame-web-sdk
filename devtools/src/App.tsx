import type React from 'react'
import { useEffect } from 'react'
import ConnectButton from './components/ConnectButton'
import ConnectionSettings from './components/ConnectionSettings'
import CopyUrlButton from './components/CopyUrlButton'
import DisconnectButton from './components/DisconnectButton'
import LocalVideo from './components/LocalVideo'
import MediaSettings from './components/MediaSettings'
import RemoteVideo from './components/RemoteVideo'
import { useSettingsStore } from './store/useSettingsStore'

const App: React.FC = () => {
  const setSettingsFromUrl = useSettingsStore((state) => state.setSettingsFromUrl)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setSettingsFromUrl(params)
  }, [setSettingsFromUrl])

  return (
    <>
      <p>
        <CopyUrlButton />
      </p>
      <MediaSettings />
      <ConnectionSettings />
      <p>
        <ConnectButton />
        <DisconnectButton />
      </p>
      <div style={{ float: 'left' }}>
        <LocalVideo />
      </div>
      <div style={{ float: 'left', marginLeft: '20px' }}>
        <RemoteVideo />
      </div>
    </>
  )
}

export default App
