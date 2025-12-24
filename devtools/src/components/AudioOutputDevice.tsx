import { useState, useEffect } from "preact/hooks";
import { audioOutputDeviceId } from "../signals";

const AudioOutputDevice = () => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    const getDevices = async () => {
      const permissionStatus = await navigator.permissions.query({
        name: "microphone" as PermissionName,
      });

      const handlePermissionChange = async () => {
        if (permissionStatus.state === "granted") {
          const deviceList = await navigator.mediaDevices.enumerateDevices();
          const audioOutputDevices = deviceList.filter((device) => device.kind === "audiooutput");
          setDevices(audioOutputDevices);
          // 現在の値がデバイスリストに存在しない場合、default または最初のデバイスを選択
          if (
            audioOutputDevices.length > 0 &&
            !audioOutputDevices.some((d) => d.deviceId === audioOutputDeviceId.value)
          ) {
            const defaultDevice = audioOutputDevices.find((d) => d.deviceId === "default");
            audioOutputDeviceId.value = defaultDevice?.deviceId ?? audioOutputDevices[0].deviceId;
          }
        } else {
          setDevices([]);
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
      class="px-2 py-1 border border-gray-300 rounded"
    >
      {devices.map((device) => (
        <option key={device.deviceId} value={device.deviceId}>
          {device.label || `Speaker ${device.deviceId}`}
        </option>
      ))}
    </select>
  );
};

export default AudioOutputDevice;
