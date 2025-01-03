import type React from 'react'
import AudioCodecMimeType from './AudioCodecMimeType'
import AudioToggle from './AudioToggle'
import CameraPermissionState from './CameraPermissionState'
import MicrophonePermissionState from './MicrophonePermissionState'
import RequestMediaPermissionButton from './RequestMediaPermissionButton'
import VideoCodecMimeType from './VideoCodecMimeType'
import VideoToggle from './VideoToggle'

const MediaSettings: React.FC = () => {
  return (
    <fieldset style={{ maxWidth: '500px' }}>
      <legend>Media settings</legend>
      <RequestMediaPermissionButton buttonText="Request media permission" />
      <p>
        Audio:
        <AudioToggle />
        <br />
        Microphone permission state:
        <MicrophonePermissionState />
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
        Video Codec (MIME type):
        <VideoCodecMimeType />
      </p>
    </fieldset>
  )
}

export default MediaSettings
