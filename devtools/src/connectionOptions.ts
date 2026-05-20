import { computed } from "@preact/signals";
import { createDefaultOptions } from "@open-ayame/ayame-web-sdk";
import type { ConnectionOptions } from "@open-ayame/ayame-web-sdk";
import {
  audioCodecMimeType,
  audioDirection,
  audioEnabled,
  audioInputDeviceId,
  clientId,
  signalingKey,
  standalone,
  videoCodecMimeType,
  videoDirection,
  videoEnabled,
  videoInputDeviceId,
  videoResolution,
} from "./signals";

const resolveDeviceId = (deviceId: string): string | undefined =>
  deviceId === "default" ? undefined : deviceId;

const buildVideoConstraints = (): boolean | MediaTrackConstraints => {
  if (!videoEnabled.value) {
    return false;
  }
  const deviceId = resolveDeviceId(videoInputDeviceId.value);
  let constraints: MediaTrackConstraints = {};
  if (deviceId !== undefined) {
    constraints.deviceId = { exact: deviceId };
  }
  if (videoResolution.value && videoResolution.value !== "undefined") {
    const [width, height] = videoResolution.value.split("x").map(Number);
    if (width && height) {
      constraints = {
        ...constraints,
        height: { ideal: height },
        width: { ideal: width },
      };
    }
  }
  return Object.keys(constraints).length > 0 ? constraints : true;
};

export const connectionOptions = computed(
  (): ConnectionOptions => ({
    ...createDefaultOptions(),
    clientId: clientId.value,
    iceServers: [],
    standalone: standalone.value || undefined,
    signalingKey: signalingKey.value || undefined,
    audio: {
      codecMimeType: audioCodecMimeType.value ?? undefined,
      direction: audioDirection.value,
      enabled: audioEnabled.value,
    },
    video: {
      codecMimeType: videoCodecMimeType.value ?? undefined,
      direction: videoDirection.value,
      enabled: videoEnabled.value,
    },
  }),
);

export const mediaConstraints = computed((): MediaStreamConstraints => {
  const audioDeviceId = resolveDeviceId(audioInputDeviceId.value);
  const audioConstraints: boolean | MediaTrackConstraints = audioEnabled.value
    ? audioDeviceId === undefined
      ? true
      : { deviceId: { exact: audioDeviceId } }
    : false;

  return {
    audio: audioConstraints,
    video: buildVideoConstraints(),
  };
});
