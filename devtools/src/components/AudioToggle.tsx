import type React from 'react'
import { useSettingsStore } from '../store/useSettingsStore.js'

const AudioToggle: React.FC = () => {
  const isEnable = useSettingsStore((state) => state.settings.audio.isEnable)
  const toggleAudio = useSettingsStore((state) => state.toggleAudio)

  return (
    <input type="checkbox" checked={isEnable} onChange={(e) => toggleAudio(e.target.checked)} />
  )
}

export default AudioToggle
