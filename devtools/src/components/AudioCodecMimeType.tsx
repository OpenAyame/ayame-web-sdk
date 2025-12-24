import { useSignal, useSignalEffect } from "@preact/signals";
import { getAvailableCodecs } from "@open-ayame/ayame-web-sdk";
import { audioCodecMimeType, audioDirection } from "../signals";

const AudioCodecMimeType = () => {
  const codecs = useSignal<string[]>([]);

  useSignalEffect(() => {
    const mimeTypes = getAvailableCodecs(
      "audio",
      audioDirection.value === "sendrecv" || audioDirection.value === "sendonly"
        ? "sender"
        : "receiver",
    );
    codecs.value = mimeTypes;
  });

  return (
    <select
      onChange={(e) => {
        audioCodecMimeType.value = (e.target as HTMLSelectElement).value;
      }}
      value={audioCodecMimeType.value}
      data-testid="audio-codec-mime-type"
      class="px-2 py-1 border border-gray-300 rounded"
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

export default AudioCodecMimeType;
