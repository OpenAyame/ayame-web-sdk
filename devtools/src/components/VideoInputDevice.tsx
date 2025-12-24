import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { videoInputDeviceId } from "../signals";

const VideoInputDevice = () => {
  const devices = useSignal<MediaDeviceInfo[]>([]);

  useEffect(() => {
    const getDevices = async () => {
      const permissionStatus = await navigator.permissions.query({
        name: "camera" as PermissionName,
      });

      const handlePermissionChange = async () => {
        if (permissionStatus.state === "granted") {
          const deviceList = await navigator.mediaDevices.enumerateDevices();
          const videoInputDevices = deviceList.filter((device) => device.kind === "videoinput");
          devices.value = videoInputDevices;
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
        videoInputDeviceId.value = (e.target as HTMLSelectElement).value;
      }}
      value={videoInputDeviceId.value}
    >
      {devices.value.map((device) => (
        <option key={device.deviceId} value={device.deviceId}>
          {device.label || `Camera ${device.deviceId}`}
        </option>
      ))}
    </select>
  );
};

export default VideoInputDevice;
