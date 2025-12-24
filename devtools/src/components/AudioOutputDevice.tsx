import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { audioOutputDeviceId } from "../store/signals";

const AudioOutputDevice = () => {
  const devices = useSignal<MediaDeviceInfo[]>([]);

  useEffect(() => {
    const getDevices = async () => {
      const permissionStatus = await navigator.permissions.query({
        name: "microphone" as PermissionName,
      });

      const handlePermissionChange = async () => {
        if (permissionStatus.state === "granted") {
          const deviceList = await navigator.mediaDevices.enumerateDevices();
          const audioOutputDevices = deviceList.filter((device) => device.kind === "audiooutput");
          devices.value = audioOutputDevices;
        } else {
          devices.value = [];
        }
      };

      // 初期状態の処理
      void handlePermissionChange();

      // 権限変更の監視
      permissionStatus.onchange = handlePermissionChange;

      return () => {
        // クリーンアップ
        permissionStatus.onchange = null;
      };
    };
    void getDevices();
  }, []);

  return (
    <select
      onChange={(e) => {
        audioOutputDeviceId.value = (e.target as HTMLSelectElement).value;
      }}
      value={audioOutputDeviceId.value}
    >
      {devices.value.map((device) => (
        <option key={device.deviceId} value={device.deviceId}>
          {device.label || `Speaker ${device.deviceId}`}
        </option>
      ))}
    </select>
  );
};

export default AudioOutputDevice;
