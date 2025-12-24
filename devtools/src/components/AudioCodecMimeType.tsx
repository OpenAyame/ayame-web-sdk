import type React from "react";
import { useEffect, useState } from "react";
import { useStore } from "../store/useStore";

import { getAvailableCodecs } from "@open-ayame/ayame-web-sdk";

const VideoCodecMimeType: React.FC = () => {
  const [codecs, setCodecs] = useState<string[]>([]);
  const setAudioCodecMimeType = useStore((state) => state.setAudioCodecMimeType);
  const audioCodecMimeType = useStore((state) => state.settings.audio.codecMimeType);
  const audioDirection = useStore((state) => state.settings.audio.direction);

  useEffect(() => {
    const mimeTypes = getAvailableCodecs(
      "audio",
      audioDirection === "sendrecv" || audioDirection === "sendonly" ? "sender" : "receiver",
    );
    setCodecs(mimeTypes);
  }, [audioDirection]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAudioCodecMimeType(e.target.value);
  };

  return (
    <select onChange={handleChange} value={audioCodecMimeType} data-testid="audio-codec-mime-type">
      <option value="undefined">未指定</option>
      {codecs.map((mimeType) => (
        <option key={mimeType} value={mimeType}>
          {mimeType}
        </option>
      ))}
    </select>
  );
};

export default VideoCodecMimeType;
