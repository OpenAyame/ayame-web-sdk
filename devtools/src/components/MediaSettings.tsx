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
    <fieldset class="mb-4 p-4 border border-gray-300 rounded max-w-lg">
      <legend class="px-2 font-semibold">Media settings</legend>
      <div class="mb-4">
        <RequestMediaPermissionButton buttonText="Request Media Permission" />
      </div>
      <div class="space-y-2 mb-4">
        <div class="flex items-center gap-2">
          <label class="w-40">Audio:</label>
          <AudioToggle />
        </div>
        <div class="flex items-center gap-2">
          <label class="w-40">Microphone permission:</label>
          <MicrophonePermissionState />
        </div>
        <div class="flex items-center gap-2">
          <label class="w-40">Audio input device:</label>
          <AudioInputDevice />
        </div>
        <div class="flex items-center gap-2">
          <label class="w-40">Audio output device:</label>
          <AudioOutputDevice />
        </div>
        <div class="flex items-center gap-2">
          <label class="w-40">Direction:</label>
          <TransceiverDirection signal={audioDirection} />
        </div>
        <div class="flex items-center gap-2">
          <label class="w-40">AudioCodec (MIME type):</label>
          <AudioCodecMimeType />
        </div>
      </div>
      <div class="space-y-2">
        <div class="flex items-center gap-2">
          <label class="w-40">Video:</label>
          <VideoToggle />
        </div>
        <div class="flex items-center gap-2">
          <label class="w-40">Camera permission:</label>
          <CameraPermissionState />
        </div>
        <div class="flex items-center gap-2">
          <label class="w-40">Video input device:</label>
          <VideoInputDevice />
        </div>
        <div class="flex items-center gap-2">
          <label class="w-40">Direction:</label>
          <TransceiverDirection signal={videoDirection} />
        </div>
        <div class="flex items-center gap-2">
          <label class="w-40">Video Codec (MIME type):</label>
          <VideoCodecMimeType />
        </div>
        <div class="flex items-center gap-2">
          <label class="w-40">Video Resolution:</label>
          <VideoResolution />
        </div>
      </div>
    </fieldset>
  );
};

export default MediaSettings;
