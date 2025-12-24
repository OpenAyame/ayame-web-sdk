import type React from "react";
import { useStore } from "../store/useStore";

const VideoToggle: React.FC = () => {
  const isEnable = useStore((state) => state.settings.video.isEnable);
  const toggleVideo = useStore((state) => state.toggleVideo);

  return (
    <input type="checkbox" checked={isEnable} onChange={(e) => toggleVideo(e.target.checked)} />
  );
};

export default VideoToggle;
