import type React from "react";
import { useEffect, useState } from "react";
import { useStore } from "../store/useStore";

import { getAvailableCodecs } from "@open-ayame/ayame-web-sdk";

const VideoCodecMimeType: React.FC = () => {
  const [codecs, setCodecs] = useState<string[]>([]);
  const setVideoCodecMimeType = useStore((state) => state.setVideoCodecMimeType);
  const videoCodecMimeType = useStore((state) => state.settings.video.codecMimeType);
  const videoDirection = useStore((state) => state.settings.video.direction);

  useEffect(() => {
    const mimeTypes = getAvailableCodecs(
      "video",
      videoDirection === "sendrecv" || videoDirection === "sendonly" ? "sender" : "receiver",
    );
    setCodecs(mimeTypes);
  }, [videoDirection]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setVideoCodecMimeType(e.target.value);
  };

  return (
    <select onChange={handleChange} value={videoCodecMimeType} data-testid="video-codec-mime-type">
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
