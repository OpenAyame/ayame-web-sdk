import { ayameConnection, localMediaStream, remoteMediaStream } from "../signals";

const DisconnectButton = () => {
  const handleClick = async () => {
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

    // ayameConnection を null にする
    ayameConnection.value = null;
  };

  return (
    <button
      data-testid="disconnect"
      type="button"
      onClick={handleClick}
      class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
    >
      Disconnect
    </button>
  );
};

export default DisconnectButton;
