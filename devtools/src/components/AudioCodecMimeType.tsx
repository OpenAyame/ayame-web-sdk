import type React from 'react'
import { useEffect, useState } from 'react'
import { useSettingsStore } from '../store/useSettingsStore'

import { getAvailableCodecs } from '@open-ayame/ayame-web-sdk'

const VideoCodecMimeType: React.FC = () => {
  const [codecs, setCodecs] = useState<string[]>([])
  const setAudioCodecMimeType = useSettingsStore((state) => state.setAudioCodecMimeType)
  const audioCodecMimeType = useSettingsStore((state) => state.settings.audio.codecMimeType)

  useEffect(() => {
    const mimeTypes = getAvailableCodecs('audio', 'sender')
    setCodecs(mimeTypes)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAudioCodecMimeType(e.target.value)
  }

  return (
    <select onChange={handleChange} value={audioCodecMimeType}>
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
