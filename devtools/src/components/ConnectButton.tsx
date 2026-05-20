import type { VNode } from "preact";
import { connectionOptions } from "../connectionOptions";
import { canConnect, connectSession, isConnecting } from "../models/ayameSession";

const ConnectButton = (): VNode => {
  return (
    <button
      data-testid="connect"
      type="button"
      disabled={!canConnect.value || isConnecting.value}
      onClick={(): void => {
        void connectSession(connectionOptions.value);
      }}
      class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
    >
      Connect
    </button>
  );
};

export default ConnectButton;
