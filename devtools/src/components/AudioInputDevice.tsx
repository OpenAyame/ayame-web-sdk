import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { audioInputDeviceId } from "../store/signals";

const AudioInputDevice = () => {
  const devices = useSignal<MediaDeviceInfo[]>([]);

  useEffect(() => {
    const getDevices = async () => {
      const permissionStatus = await navigator.permissions.query({
        name: "microphone" as PermissionName,
      });

      const handlePermissionChange = async () => {
        if (permissionStatus.state === "granted") {
          const deviceList = await navigator.mediaDevices.enumerateDevices();
          const audioInputDevices = deviceList.filter((device) => device.kind === "audioinput");
          devices.value = audioInputDevices;
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
        audioInputDeviceId.value = (e.target as HTMLSelectElement).value;
      }}
      value={audioInputDeviceId.value}
    >
      {devices.value.map((device) => (
        <option key={device.deviceId} value={device.deviceId}>
          {device.label || `Microphone ${device.deviceId}`}
        </option>
      ))}
    </select>
  );
};

export default AudioInputDevice;
