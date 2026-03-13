import type { VNode } from "preact";
import { ayameConnection, localMediaStream, remoteMediaStream } from "../signals";

const DisconnectButton = (): VNode => {
  const handleClick = async (): Promise<void> => {
    const conn = ayameConnection.value;
    if (!conn) {
      return;
    }

    const stream = localMediaStream.value;
    if (stream) {
      for (const track of stream.getTracks()) {
        track.stop();
      }
    }

    await conn.disconnect();

    localMediaStream.value = null;
    remoteMediaStream.value = null;

    // AyameConnection を null にする
    ayameConnection.value = null;
  };

  return (
    <button
      data-testid="disconnect"
      type="button"
      onClick={(): void => {
        void handleClick();
      }}
      class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
    >
      Disconnect
    </button>
  );
};

export default DisconnectButton;
