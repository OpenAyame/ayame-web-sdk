import type { VNode } from "preact";
import { signalingUrl } from "../signals";

const SignalingUrl = (): VNode => (
  <input
    type="text"
    class="w-80 px-2 py-1 border border-gray-300 rounded"
    value={signalingUrl.value}
    onChange={(e) => {
      signalingUrl.value = (e.target as HTMLInputElement).value;
    }}
  />
);

export default SignalingUrl;
