import type React from 'react'
import { useSettingsStore } from '../store/useSettingsStore'
import AudioCodecMimeType from './AudioCodecMimeType'
import AudioToggle from './AudioToggle'
import CameraPermissionState from './CameraPermissionState'
import MicrophonePermissionState from './MicrophonePermissionState'
import RequestMediaPermissionButton from './RequestMediaPermissionButton'
import TransceiverDirection from './TransceiverDirection'
import VideoCodecMimeType from './VideoCodecMimeType'
import VideoToggle from './VideoToggle'

const MediaSettings: React.FC = () => {
  const audioDirection = useSettingsStore((state) => state.settings.audio.direction)
  const setAudioDirection = useSettingsStore((state) => state.setAudioDirection)
  const videoDirection = useSettingsStore((state) => state.settings.video.direction)
  const setVideoDirection = useSettingsStore((state) => state.setVideoDirection)

  return (
    <fieldset style={{ maxWidth: '500px' }}>
      <legend>Media settings</legend>
      <p>
        <RequestMediaPermissionButton buttonText="Request Media Permission" />
      </p>
      <p>
        Audio:
        <AudioToggle />
        <br />
        Microphone permission state:
        <MicrophonePermissionState />
        <br />
        Direction:
        <TransceiverDirection value={audioDirection} onChange={setAudioDirection} />
        <br />
        AudioCodec (MIME type):
        <AudioCodecMimeType />
      </p>
      <p>
        Video:
        <VideoToggle />
        <br />
        Camera permission state:
        <CameraPermissionState />
        <br />
        Direction:
        <TransceiverDirection value={videoDirection} onChange={setVideoDirection} />
        <br />
        Video Codec (MIME type):
        <VideoCodecMimeType />
      </p>
    </fieldset>
  )
}

export default MediaSettings
