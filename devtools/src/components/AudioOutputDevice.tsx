import type React from "react";
import { useEffect, useState } from "react";
import { useStore } from "../store/useStore";

const AudioOutputDevice: React.FC = () => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const setAudioOutputDeviceId = useStore((state) => state.setAudioOutputDeviceId);
  const audioOutputDeviceId = useStore((state) => state.mediaDevice.audioOutputDeviceId);

  useEffect(() => {
    const getDevices = async () => {
      const permissionStatus = await navigator.permissions.query({
        name: "microphone" as PermissionName,
      });

      const handlePermissionChange = async () => {
        if (permissionStatus.state === "granted") {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const audioOutputDevices = devices.filter((device) => device.kind === "audiooutput");
          setDevices(audioOutputDevices);
        } else {
          setDevices([]);
        }
      };

      // 初期状態の処理
      handlePermissionChange();

      // 権限変更の監視
      permissionStatus.onchange = handlePermissionChange;

      return () => {
        // ククリーンアップ
        permissionStatus.onchange = null;
      };
    };
    getDevices();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAudioOutputDeviceId(e.target.value);
  };

  return (
    <select onChange={handleChange} value={audioOutputDeviceId}>
      {devices.map((device) => (
        <option key={device.deviceId} value={device.deviceId}>
          {device.label || `Speaker ${device.deviceId}`}
        </option>
      ))}
    </select>
  );
};

export default AudioOutputDevice;
