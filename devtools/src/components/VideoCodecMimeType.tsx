import { useSignal, useSignalEffect } from "@preact/signals";
import { getAvailableCodecs } from "@open-ayame/ayame-web-sdk";
import { videoCodecMimeType, videoDirection } from "../store/signals";

const VideoCodecMimeType = () => {
  const codecs = useSignal<string[]>([]);

  useSignalEffect(() => {
    const mimeTypes = getAvailableCodecs(
      "video",
      videoDirection.value === "sendrecv" || videoDirection.value === "sendonly"
        ? "sender"
        : "receiver",
    );
    codecs.value = mimeTypes;
  });

  return (
    <select
      onChange={(e) => {
        videoCodecMimeType.value = (e.target as HTMLSelectElement).value;
      }}
      value={videoCodecMimeType.value}
      data-testid="video-codec-mime-type"
    >
      <option value="undefined">未指定</option>
      {codecs.value.map((mimeType) => (
        <option key={mimeType} value={mimeType}>
          {mimeType}
        </option>
      ))}
    </select>
  );
};

export default VideoCodecMimeType;
