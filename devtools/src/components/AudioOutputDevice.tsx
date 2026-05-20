import type { VNode } from "preact";
import { useEffect, useState } from "preact/hooks";
import { audioOutputDeviceId } from "../signals";

const AudioOutputDevice = (): VNode => {
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
        const audioOutputDevices = deviceList.filter((device) => device.kind === "audiooutput");
        setDevices(audioOutputDevices);
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
