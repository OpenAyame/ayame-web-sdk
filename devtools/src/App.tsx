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

const App = () => {
  const params = new URLSearchParams(window.location.search);
  setSettingsFromUrl(params);

  return (
    <>
      <div>
        Ayame Web SDK Version: <AyameVersion />
      </div>
      <p>
        <CopyUrlButton />
      </p>
      <MediaSettings />
      <ConnectionSettings />
      <p>
        <ConnectButton />
        <DisconnectButton />
      </p>
      <div
        style={{
          float: "left",
        }}
      >
        <LocalVideo />
      </div>
      <div
        style={{
          float: "left",
          marginLeft: "20px",
        }}
      >
        <RemoteVideo />
      </div>
      <DatasetConnectionState />
    </>
  );
};

export default App;
