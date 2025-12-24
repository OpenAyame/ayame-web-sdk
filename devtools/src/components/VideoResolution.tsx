import { videoResolution } from "../store/signals";

const VideoResolution = () => {
  return (
    <input
      type="text"
      value={videoResolution.value}
      onChange={(e) => {
        videoResolution.value = (e.target as HTMLInputElement).value;
      }}
      placeholder="640x480"
    />
  );
};

export default VideoResolution;
