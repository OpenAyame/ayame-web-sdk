import type { Signal } from "@preact/signals";
import type { Direction } from "@open-ayame/ayame-web-sdk";

const DIRECTION = {
  SENDRECV: "sendrecv",
  SENDONLY: "sendonly",
  RECVONLY: "recvonly",
} as const;

type Props = {
  signal: Signal<Direction>;
};

const TransceiverDirection = ({ signal }: Props) => {
  return (
    <select
      value={signal.value}
      onChange={(e) => {
        signal.value = (e.target as HTMLSelectElement).value as Direction;
      }}
      class="px-2 py-1 border border-gray-300 rounded"
    >
      {(Object.values(DIRECTION) as Direction[]).map((direction) => (
        <option key={direction} value={direction}>
          {direction}
        </option>
      ))}
    </select>
  );
};

export default TransceiverDirection;
