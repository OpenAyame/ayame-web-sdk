import type { VNode } from "preact";
import { useComputed } from "@preact/signals";
import { getAvailableCodecs } from "@open-ayame/ayame-web-sdk";
import { videoCodecMimeType, videoDirection } from "../signals";

const VideoCodecMimeType = (): VNode => {
  const codecs = useComputed(() =>
    getAvailableCodecs(
      "video",
      videoDirection.value === "sendrecv" || videoDirection.value === "sendonly"
        ? "sender"
        : "receiver",
    ),
  );

  return (
    <select
      onChange={(e) => {
        const value = (e.target as HTMLSelectElement).value;
        videoCodecMimeType.value = value === "" ? null : value;
      }}
      value={videoCodecMimeType.value ?? ""}
      data-testid="video-codec-mime-type"
      class="px-2 py-1 border border-gray-300 rounded"
    >
      <option value="">未指定</option>
      {codecs.value.map((mimeType) => (
        <option key={mimeType} value={mimeType}>
          {mimeType}
        </option>
      ))}
    </select>
  );
};

export default VideoCodecMimeType;
