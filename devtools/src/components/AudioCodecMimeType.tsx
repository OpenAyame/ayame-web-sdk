import type { VNode } from "preact";
import { useComputed } from "@preact/signals";
import { getAvailableCodecs } from "@open-ayame/ayame-web-sdk";
import { audioCodecMimeType, audioDirection } from "../signals";

const AudioCodecMimeType = (): VNode => {
  const codecs = useComputed(() =>
    getAvailableCodecs(
      "audio",
      audioDirection.value === "sendrecv" || audioDirection.value === "sendonly"
        ? "sender"
        : "receiver",
    ),
  );

  return (
    <select
      onChange={(e) => {
        const value = (e.target as HTMLSelectElement).value;
        audioCodecMimeType.value = value === "" ? null : value;
      }}
      value={audioCodecMimeType.value ?? ""}
      data-testid="audio-codec-mime-type"
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

export default AudioCodecMimeType;
