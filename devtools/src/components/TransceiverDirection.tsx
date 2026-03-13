import type { VNode } from "preact";
import type { Signal } from "@preact/signals";
import type { Direction } from "@open-ayame/ayame-web-sdk";

const DIRECTION = {
  RECVONLY: "recvonly",
  SENDONLY: "sendonly",
  SENDRECV: "sendrecv",
} as const;

function isDirection(value: string): value is Direction {
  return value === "sendrecv" || value === "recvonly" || value === "sendonly";
}

interface Props {
  signal: Signal<Direction>;
}

const TransceiverDirection = ({ signal }: Props): VNode => (
  <select
    value={signal.value}
    onChange={(e) => {
      const value = (e.target as HTMLSelectElement).value;
      if (isDirection(value)) {
        signal.value = value;
      }
    }}
    class="px-2 py-1 border border-gray-300 rounded"
  >
    {Object.values(DIRECTION).map((direction) => (
      <option key={direction} value={direction}>
        {direction}
      </option>
    ))}
  </select>
);

export default TransceiverDirection;
