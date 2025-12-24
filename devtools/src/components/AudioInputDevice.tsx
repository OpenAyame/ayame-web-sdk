import type React from "react";
import { useEffect, useState } from "react";
import { useStore } from "../store/useStore";

const AudioInputDevice: React.FC = () => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const setAudioInputDeviceId = useStore((state) => state.setAudioInputDeviceId);
  const audioInputDeviceId = useStore((state) => state.mediaDevice.audioInputDeviceId);

  useEffect(() => {
    const getDevices = async () => {
      const permissionStatus = await navigator.permissions.query({
        name: "microphone" as PermissionName,
      });

      const handlePermissionChange = async () => {
        if (permissionStatus.state === "granted") {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const audioInputDevices = devices.filter((device) => device.kind === "audioinput");
          setDevices(audioInputDevices);
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
    setAudioInputDeviceId(e.target.value);
  };

  return (
    <select onChange={handleChange} value={audioInputDeviceId}>
      {devices.map((device) => (
        <option key={device.deviceId} value={device.deviceId}>
          {device.label || `Microphone ${device.deviceId}`}
        </option>
      ))}
    </select>
  );
};

export default AudioInputDevice;
