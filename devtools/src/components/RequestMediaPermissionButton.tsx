import type { VNode } from "preact";
import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { audioEnabled, videoEnabled, videoResolution } from "../signals";

interface Props {
  buttonText?: string;
}

const RequestMediaPermissionButton = ({
  buttonText = "Request media permission",
}: Props): VNode => {
  const isPermissionsGranted = useSignal(false);

  useEffect(() => {
    const permissionsToCheck: PermissionStatus[] = [];
    let cancelled = false;

    const checkPermissions = async (): Promise<void> => {
      if (audioEnabled.value) {
        const mic = await navigator.permissions.query({ name: "microphone" as PermissionName });
        if (cancelled) {
          return;
        }
        permissionsToCheck.push(mic);
      }
      if (videoEnabled.value) {
        const cam = await navigator.permissions.query({ name: "camera" as PermissionName });
        if (cancelled) {
          return;
        }
        permissionsToCheck.push(cam);
      }

      if (cancelled) {
        return;
      }
      for (const p of permissionsToCheck) {
        p.onchange = () => {
          if (cancelled) {
            return;
          }
          isPermissionsGranted.value = permissionsToCheck.every((pp) => pp.state === "granted");
        };
      }

      if (permissionsToCheck.length === 0) {
        isPermissionsGranted.value = true;
        return;
      }
      isPermissionsGranted.value = permissionsToCheck.every((p) => p.state === "granted");
    };
    void checkPermissions();

    return () => {
      cancelled = true;
      for (const p of permissionsToCheck) {
        p.onchange = null;
      }
    };
  }, [audioEnabled.value, videoEnabled.value]);

  const handleClick = async (): Promise<void> => {
    try {
      let videoConstraints: boolean | MediaTrackConstraints = videoEnabled.value;
      if (videoEnabled.value && videoResolution.value && videoResolution.value !== "undefined") {
        const [width, height] = videoResolution.value.split("x").map(Number);
        if (width && height) {
          videoConstraints = {
            height: {
              ideal: height,
            },
            width: {
              ideal: width,
            },
          };
        }
      }
      const constraints = {
        audio: audioEnabled.value,
        video: videoConstraints,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      for (const track of stream.getTracks()) {
        track.stop();
      }
    } catch (error) {
      globalThis.console.error("Failed to get media devices:", error);
    }
  };

  if ("HTMLPermissionElement" in globalThis) {
    // @ts-expect-error HTMLPermissionElement を認識しないため
    return <permission type="microphone camera" />;
  }

  return (
    <button
      type="button"
      disabled={isPermissionsGranted.value}
      onClick={(): void => {
        void handleClick();
      }}
      class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
    >
      {buttonText}
    </button>
  );
};

export default RequestMediaPermissionButton;
