import type React from "react";
import { useStore } from "../store/useStore";

const AudioToggle: React.FC = () => {
  const isEnable = useStore((state) => state.settings.audio.isEnable);
  const toggleAudio = useStore((state) => state.toggleAudio);

  return (
    <input type="checkbox" checked={isEnable} onChange={(e) => toggleAudio(e.target.checked)} />
  );
};

export default AudioToggle;
