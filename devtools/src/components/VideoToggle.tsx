import type React from 'react'
import { useSettingsStore } from '../store/useSettingsStore.js'

const VideoToggle: React.FC = () => {
  const isEnable = useSettingsStore((state) => state.settings.video.isEnable)
  const toggleVideo = useSettingsStore((state) => state.toggleVideo)

  return (
    <input type="checkbox" checked={isEnable} onChange={(e) => toggleVideo(e.target.checked)} />
  )
}

export default VideoToggle
