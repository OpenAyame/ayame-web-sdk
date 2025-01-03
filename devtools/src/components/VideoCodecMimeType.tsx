import type React from 'react'
import { useEffect, useState } from 'react'
import { useSettingsStore } from '../store/useSettingsStore'

import { getAvailableCodecs } from '@open-ayame/ayame-web-sdk'

const VideoCodecMimeType: React.FC = () => {
  const [codecs, setCodecs] = useState<string[]>([])
  const setVideoCodecMimeType = useSettingsStore((state) => state.setVideoCodecMimeType)
  const videoCodecMimeType = useSettingsStore((state) => state.settings.video.codecMimeType)

  useEffect(() => {
    const mimeTypes = getAvailableCodecs('video', 'sender')
    setCodecs(mimeTypes)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setVideoCodecMimeType(e.target.value)
  }

  return (
    <select onChange={handleChange} value={videoCodecMimeType}>
      <option value="undefined">未指定</option>
      {codecs.map((mimeType) => (
        <option key={mimeType} value={mimeType}>
          {mimeType}
        </option>
      ))}
    </select>
  )
}

export default VideoCodecMimeType
