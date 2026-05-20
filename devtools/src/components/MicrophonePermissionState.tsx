import type { VNode } from "preact";
import { useSignalEffect } from "@preact/signals";
import { microphonePermissionState } from "../signals";

const MicrophonePermissionState = (): VNode => {
  useSignalEffect(() => {
    let cancelled = false;
    let permissionStatus: PermissionStatus | undefined;

    void (async () => {
      permissionStatus = await navigator.permissions.query({
        name: "microphone" as PermissionName,
      });
      if (cancelled) {
        return;
      }
      microphonePermissionState.value = permissionStatus.state;
      permissionStatus.onchange = () => {
        if (cancelled || !permissionStatus) {
          return;
        }
        microphonePermissionState.value = permissionStatus.state;
      };
    })();

    return () => {
      cancelled = true;
      if (permissionStatus) {
        permissionStatus.onchange = null;
      }
    };
  });

  return <>{microphonePermissionState.value}</>;
};

export default MicrophonePermissionState;
