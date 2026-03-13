import type { VNode } from "preact";
import { standalone } from "../signals";

const StandaloneToggle = (): VNode => (
  <input
    type="checkbox"
    checked={standalone.value}
    onChange={(e) => {
      standalone.value = (e.target as HTMLInputElement).checked;
    }}
  />
);

export default StandaloneToggle;
