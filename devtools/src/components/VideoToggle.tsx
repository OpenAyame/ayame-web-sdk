import { videoEnabled } from "../signals";

const VideoToggle = () => {
  return (
    <input
      type="checkbox"
      checked={videoEnabled.value}
      onChange={(e) => {
        videoEnabled.value = (e.target as HTMLInputElement).checked;
      }}
    />
  );
};

export default VideoToggle;
