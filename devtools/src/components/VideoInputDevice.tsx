import { useState, useEffect } from "preact/hooks";
import { videoInputDeviceId } from "../signals";

const VideoInputDevice = () => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    const getDevices = async () => {
      const permissionStatus = await navigator.permissions.query({
        name: "camera" as PermissionName,
      });

      const handlePermissionChange = async () => {
        if (permissionStatus.state === "granted") {
          const deviceList = await navigator.mediaDevices.enumerateDevices();
          const videoInputDevices = deviceList.filter((device) => device.kind === "videoinput");
          setDevices(videoInputDevices);
          // 現在の値がデバイスリストに存在しない場合、default または最初のデバイスを選択
          if (
            videoInputDevices.length > 0 &&
            !videoInputDevices.some((d) => d.deviceId === videoInputDeviceId.value)
          ) {
            const defaultDevice = videoInputDevices.find((d) => d.deviceId === "default");
            videoInputDeviceId.value = defaultDevice?.deviceId ?? videoInputDevices[0].deviceId;
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
        videoInputDeviceId.value = (e.target as HTMLSelectElement).value;
      }}
      value={videoInputDeviceId.value}
      class="px-2 py-1 border border-gray-300 rounded"
    >
      {devices.map((device) => (
        <option key={device.deviceId} value={device.deviceId}>
          {device.label || `Camera ${device.deviceId}`}
        </option>
      ))}
    </select>
  );
};

export default VideoInputDevice;
