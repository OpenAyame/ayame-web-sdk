import type React from 'react'
import { useEffect, useState } from 'react'
import { useSettingsStore } from '../store/useSettingsStore'

import { getAvailableCodecs } from '@open-ayame/ayame-web-sdk'

const VideoCodecMimeType: React.FC = () => {
  const [codecs, setCodecs] = useState<string[]>([])
  const setAudioCodecMimeType = useSettingsStore((state) => state.setAudioCodecMimeType)
  const audioCodecMimeType = useSettingsStore((state) => state.settings.audio.codecMimeType)
  const audioDirection = useSettingsStore((state) => state.settings.audio.direction)

  useEffect(() => {
    const mimeTypes = getAvailableCodecs(
      'audio',
      audioDirection === 'sendrecv' || audioDirection === 'sendonly' ? 'sender' : 'receiver',
    )
    setCodecs(mimeTypes)
  }, [audioDirection])

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
