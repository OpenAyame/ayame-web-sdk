import type { VNode } from "preact";
import { audioEnabled } from "../signals";

const AudioToggle = (): VNode => (
  <input
    type="checkbox"
    checked={audioEnabled.value}
    onChange={(e) => {
      audioEnabled.value = (e.target as HTMLInputElement).checked;
    }}
  />
);

export default AudioToggle;
