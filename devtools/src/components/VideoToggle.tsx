import type { VNode } from "preact";
import { videoEnabled } from "../signals";

const VideoToggle = (): VNode => (
  <input
    type="checkbox"
    checked={videoEnabled.value}
    onChange={(e) => {
      videoEnabled.value = (e.target as HTMLInputElement).checked;
    }}
  />
);

export default VideoToggle;
