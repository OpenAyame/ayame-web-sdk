import type React from 'react'
import { useSettingsStore } from '../store/useSettingsStore'

const RequestMediaPermissionButton: React.FC<{
  buttonText?: string
}> = ({ buttonText = 'Request media permission' }) => {
  const isAudioEnabled = useSettingsStore((state) => state.settings.audio.isEnable)
  const isVideoEnabled = useSettingsStore((state) => state.settings.video.isEnable)

  const handleClick = async () => {
    try {
      const constraints = {
        audio: isAudioEnabled,
        video: isVideoEnabled,
      }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      for (const track of stream.getTracks()) {
        track.stop()
      }
    } catch (error) {
      console.error('メディアデバイスの取得に失敗しました:', error)
    }
  }

  return (
    <button type="button" onClick={handleClick}>
      {buttonText}
    </button>
  )
}

export default RequestMediaPermissionButton
