import type { VNode } from "preact";
import { useEffect, useState } from "preact/hooks";
import { audioInputDeviceId } from "../signals";

const AudioInputDevice = (): VNode => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    let cancelled = false;
    let permissionStatus: PermissionStatus | undefined;

    const handlePermissionChange = async (): Promise<void> => {
      if (cancelled || !permissionStatus) {
        return;
      }
      if (permissionStatus.state === "granted") {
        const deviceList = await navigator.mediaDevices.enumerateDevices();
        if (cancelled) {
          return;
        }
        const audioInputDevices = deviceList.filter((device) => device.kind === "audioinput");
        setDevices(audioInputDevices);
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

    void (async () => {
      permissionStatus = await navigator.permissions.query({
        name: "microphone" as PermissionName,
      });
      if (cancelled) {
        return;
      }
      await handlePermissionChange();
      permissionStatus.onchange = () => {
        void handlePermissionChange();
      };
    })();

    return () => {
      cancelled = true;
      if (permissionStatus) {
        permissionStatus.onchange = null;
      }
    };
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
