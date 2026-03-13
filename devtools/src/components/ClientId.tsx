import type { VNode } from "preact";
import { clientId } from "../signals";

const ClientId = (): VNode => (
  <input
    type="text"
    class="w-80 px-2 py-1 border border-gray-300 rounded"
    value={clientId.value}
    onChange={(e) => {
      clientId.value = (e.target as HTMLInputElement).value;
    }}
  />
);

export default ClientId;
