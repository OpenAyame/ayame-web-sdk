import type { Direction as AyameDirection } from "@open-ayame/ayame-web-sdk";
import type React from "react";

// 型チェック
type AssertDirection<T extends AyameDirection> = T;
type CheckDirection = AssertDirection<AyameDirection>;

const DIRECTION = {
  SENDRECV: "sendrecv",
  SENDONLY: "sendonly",
  RECVONLY: "recvonly",
} as const;

type Direction = (typeof DIRECTION)[keyof typeof DIRECTION];

type Props = {
  value: Direction;
  onChange: (direction: Direction) => void;
};

const TransceiverDirection: React.FC<Props> = ({ value, onChange }) => {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as Direction)}>
      {(Object.values(DIRECTION) as Direction[]).map((direction) => (
        <option key={direction} value={direction}>
          {direction}
        </option>
      ))}
    </select>
  );
};

export default TransceiverDirection;
