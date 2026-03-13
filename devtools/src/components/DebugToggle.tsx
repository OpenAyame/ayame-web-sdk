import type { VNode } from "preact";
import { debug } from "../signals";

const DebugToggle = (): VNode => (
  <input
    type="checkbox"
    checked={debug.value}
    onChange={(e) => {
      debug.value = (e.target as HTMLInputElement).checked;
    }}
  />
);

export default DebugToggle;
