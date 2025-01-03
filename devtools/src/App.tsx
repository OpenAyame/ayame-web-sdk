import type React from 'react'
import { useEffect } from 'react'
import AudioCodecMimeType from './components/AudioCodecMimeType'
import AudioToggle from './components/AudioToggle'
import CopyUrlButton from './components/CopyUrlButton'
import VideoCodecMimeType from './components/VideoCodecMimeType'
import VideoToggle from './components/VideoToggle'
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
      <p>
        Audio:
        <AudioToggle />
        <br />
        AudioCodecMimeType:
        <AudioCodecMimeType />
      </p>
      <p>
        Video:
        <VideoToggle />
        <br />
        VideoCodecMimeType:
        <VideoCodecMimeType />
      </p>
    </>
  )
}

export default App
