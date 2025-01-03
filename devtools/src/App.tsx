import type React from 'react'
import { useEffect } from 'react'
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
      <CopyUrlButton />
      <MediaSettings />
    </>
  )
}

export default App
