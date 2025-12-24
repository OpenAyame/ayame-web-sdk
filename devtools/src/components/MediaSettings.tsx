import { audioDirection, videoDirection } from "../signals";
import AudioCodecMimeType from "./AudioCodecMimeType";
import AudioInputDevice from "./AudioInputDevice";
import AudioOutputDevice from "./AudioOutputDevice";
import AudioToggle from "./AudioToggle";
import CameraPermissionState from "./CameraPermissionState";
import MicrophonePermissionState from "./MicrophonePermissionState";
import RequestMediaPermissionButton from "./RequestMediaPermissionButton";
import TransceiverDirection from "./TransceiverDirection";
import VideoCodecMimeType from "./VideoCodecMimeType";
import VideoInputDevice from "./VideoInputDevice";
import VideoResolution from "./VideoResolution";
import VideoToggle from "./VideoToggle";

const MediaSettings = () => {
  return (
    <fieldset
      style={{
        maxWidth: "500px",
      }}
    >
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
        Audio input device:
        <AudioInputDevice />
        <br />
        Audio output device:
        <AudioOutputDevice />
        <br />
        Direction:
        <TransceiverDirection signal={audioDirection} />
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
        Video input device:
        <VideoInputDevice />
        <br />
        Direction:
        <TransceiverDirection signal={videoDirection} />
        <br />
        Video Codec (MIME type):
        <VideoCodecMimeType />
        <br />
        Video Resolution:
        <VideoResolution />
      </p>
    </fieldset>
  );
};

export default MediaSettings;
