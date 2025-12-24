import type React from "react";
import { useEffect, useState } from "react";
import { useStore } from "../store/useStore";

const VideoInputDevice: React.FC = () => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const setVideoInputDeviceId = useStore((state) => state.setVideoInputDeviceId);
  const videoInputDeviceId = useStore((state) => state.mediaDevice.videoInputDeviceId);

  useEffect(() => {
    const getDevices = async () => {
      const permissionStatus = await navigator.permissions.query({
        name: "camera" as PermissionName,
      });

      const handlePermissionChange = async () => {
        if (permissionStatus.state === "granted") {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoInputDevices = devices.filter((device) => device.kind === "videoinput");
          setDevices(videoInputDevices);
        } else {
          setDevices([]);
        }
      };

      // 初期状態の処理
      void handlePermissionChange();

      // 権限変更の監視
      permissionStatus.onchange = handlePermissionChange;

      return () => {
        // ククリーンアップ
        permissionStatus.onchange = null;
      };
    };
    void getDevices();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setVideoInputDeviceId(e.target.value);
  };

  return (
    <select onChange={handleChange} value={videoInputDeviceId}>
      {devices.map((device) => (
        <option key={device.deviceId} value={device.deviceId}>
          {device.label || `Camera ${device.deviceId}`}
        </option>
      ))}
    </select>
  );
};

export default VideoInputDevice;
