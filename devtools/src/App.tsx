import type React from 'react'
import { useEffect } from 'react'
import ConnectionSettings from './components/ConnectionSettings'
import CopyUrlButton from './components/CopyUrlButton'
import MediaSettings from './components/MediaSettings'
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
    </>
  )
}

export default App
