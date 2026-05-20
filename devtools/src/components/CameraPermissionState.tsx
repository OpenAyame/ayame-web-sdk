import type { VNode } from "preact";
import { useSignalEffect } from "@preact/signals";
import { cameraPermissionState } from "../signals";

const CameraPermissionState = (): VNode => {
  useSignalEffect(() => {
    let cancelled = false;
    let permissionStatus: PermissionStatus | undefined;

    void (async () => {
      permissionStatus = await navigator.permissions.query({
        name: "camera" as PermissionName,
      });
      if (cancelled) {
        return;
      }
      cameraPermissionState.value = permissionStatus.state;
      permissionStatus.onchange = () => {
        if (cancelled || !permissionStatus) {
          return;
        }
        cameraPermissionState.value = permissionStatus.state;
      };
    })();

    return () => {
      cancelled = true;
      if (permissionStatus) {
        permissionStatus.onchange = null;
      }
    };
  });

  return <>{cameraPermissionState.value}</>;
};

export default CameraPermissionState;
