import { videoResolution } from "../signals";

const VideoResolution = () => {
  return (
    <input
      type="text"
      class="w-32 px-2 py-1 border border-gray-300 rounded"
      value={videoResolution.value}
      onChange={(e) => {
        videoResolution.value = (e.target as HTMLInputElement).value;
      }}
      placeholder="640x480"
    />
  );
};

export default VideoResolution;
