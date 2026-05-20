import type { VNode } from "preact";
import { useEffect, useState } from "preact/hooks";
import { videoInputDeviceId } from "../signals";

const VideoInputDevice = (): VNode => {
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
        const videoInputDevices = deviceList.filter((device) => device.kind === "videoinput");
        setDevices(videoInputDevices);
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

    void (async () => {
      permissionStatus = await navigator.permissions.query({
        name: "camera" as PermissionName,
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
