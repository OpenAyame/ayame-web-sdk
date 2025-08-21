import type React from 'react'
import { useStore } from '../store/useStore'

const VideoResolution: React.FC = () => {
  const videoResolution = useStore((state) => state.settings.video.resolution)
  const setVideoResolution = useStore((state) => state.setVideoResolution)

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setVideoResolution(event.target.value)
  }

  return (
    <input
      type="text"
      value={videoResolution}
      onChange={handleChange}
      placeholder="640x480"
    />
  )
}

export default VideoResolution