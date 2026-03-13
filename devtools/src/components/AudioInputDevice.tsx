import type { VNode } from "preact";
import { useEffect, useState } from "preact/hooks";
import { audioInputDeviceId } from "../signals";

const AudioInputDevice = (): VNode => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    const getDevices = async () => {
      const permissionStatus = await navigator.permissions.query({
        name: "microphone" as PermissionName,
      });

      const handlePermissionChange = async (): Promise<void> => {
        if (permissionStatus.state === "granted") {
          const deviceList = await navigator.mediaDevices.enumerateDevices();
          const audioInputDevices = deviceList.filter((device) => device.kind === "audioinput");
          setDevices(audioInputDevices);
          // 現在の値がデバイスリストに存在しない場合、default または最初のデバイスを選択
          if (
            audioInputDevices.length > 0 &&
            !audioInputDevices.some((d) => d.deviceId === audioInputDeviceId.value)
          ) {
            const defaultDevice = audioInputDevices.find((d) => d.deviceId === "default");
            audioInputDeviceId.value = defaultDevice?.deviceId ?? audioInputDevices[0].deviceId;
          }
        } else {
          setDevices([]);
        }
      };

      // 初期状態の処理
      void handlePermissionChange();

      // 権限変更の監視
      permissionStatus.onchange = handlePermissionChange;

      return (): void => {
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
      class="px-2 py-1 border border-gray-300 rounded"
    >
      {devices.map((device) => (
        <option key={device.deviceId} value={device.deviceId}>
          {device.label || `Microphone ${device.deviceId}`}
        </option>
      ))}
    </select>
  );
};

export default AudioInputDevice;
