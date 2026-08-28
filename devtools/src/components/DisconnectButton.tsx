import type { VNode } from "preact";
import { disconnectSession, isConnecting } from "../models/ayameSession";

const DisconnectButton = (): VNode => {
  return (
    <button
      data-testid="disconnect"
      type="button"
      disabled={isConnecting.value}
      onClick={(): void => {
        void disconnectSession();
      }}
      class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
    >
      Disconnect
    </button>
  );
};

export default DisconnectButton;
