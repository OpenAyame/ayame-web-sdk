import type { VNode } from "preact";
import { useEffect } from "preact/hooks";
import AyameVersion from "./components/AyameWebSdkVersion";
import ConnectButton from "./components/ConnectButton";
import ConnectionSettings from "./components/ConnectionSettings";
import CopyUrlButton from "./components/CopyUrlButton";
import DatasetConnectionState from "./components/DatasetConnectionState";
import DisconnectButton from "./components/DisconnectButton";
import LocalVideo from "./components/LocalVideo";
import MediaSettings from "./components/MediaSettings";
import RemoteVideo from "./components/RemoteVideo";
import { setSettingsFromUrl } from "./signals";

const App = (): VNode => {
  useEffect(() => {
    const params = new URLSearchParams(globalThis.location.search);
    setSettingsFromUrl(params);
  }, []);

  return (
    <div class="p-4">
      <header class="mb-4 pb-4 border-b border-gray-300">
        <h1 class="text-2xl font-bold text-gray-800">Ayame DevTools</h1>
        <p class="text-sm text-gray-500">
          Ayame Web SDK Version: <AyameVersion />
        </p>
      </header>
      <div class="mb-4">
        <CopyUrlButton />
      </div>
      <MediaSettings />
      <ConnectionSettings />
      <div class="mb-4 space-x-2">
        <ConnectButton />
        <DisconnectButton />
      </div>
      <div class="flex gap-5">
        <LocalVideo />
        <RemoteVideo />
      </div>
      <DatasetConnectionState />
    </div>
  );
};

export default App;
