import type { VNode } from "preact";
import { createConnection, createDefaultOptions } from "@open-ayame/ayame-web-sdk";
// eslint-disable-next-line no-duplicate-imports -- consistent-type-specifier-style との競合を回避
import type { AyameAddStreamEvent, ConnectionOptions } from "@open-ayame/ayame-web-sdk";
import {
  audioCodecMimeType,
  audioDirection,
  audioEnabled,
  ayameConnection,
  ayameConnectionState,
  debug,
  localMediaStream,
  remoteMediaStream,
  roomId,
  signalingKey,
  signalingUrl,
  videoCodecMimeType,
  videoDirection,
  videoEnabled,
  videoResolution,
} from "../signals";

const ConnectButton = (): VNode => {
  const handleClick = async (): Promise<void> => {
    const base = createDefaultOptions();
    const options: ConnectionOptions = {
      ...base,
      audio: {
        ...base.audio,
        codecMimeType:
          audioCodecMimeType.value === "undefined" ? undefined : audioCodecMimeType.value,
        direction: audioDirection.value,
        enabled: audioEnabled.value,
      },
      signalingKey: signalingKey.value || undefined,
      video: {
        ...base.video,
        codecMimeType:
          videoCodecMimeType.value === "undefined" ? undefined : videoCodecMimeType.value,
        direction: videoDirection.value,
        enabled: videoEnabled.value,
      },
    };

    const conn = createConnection(signalingUrl.value, roomId.value, options, debug.value);

    let localStream: MediaStream | null = null;

    if (
      (audioEnabled.value && audioDirection.value !== "recvonly") ||
      (videoEnabled.value && videoDirection.value !== "recvonly")
    ) {
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
      localStream = await navigator.mediaDevices.getUserMedia({
        audio: audioEnabled.value,
        video: videoConstraints,
      });
      localMediaStream.value = localStream;
    }

    conn.on("addstream", (event: AyameAddStreamEvent) => {
      remoteMediaStream.value = event.stream;
    });

    conn.on("open", () => {
      const pc = conn.peerConnection;
      if (!pc) {
        return;
      }
      pc.onconnectionstatechange = (): void => {
        ayameConnectionState.value = pc.connectionState;
      };
      window.__ayameDevtoolsPeerConnection = pc;
    });

    // 切断時にローカルとリモートのメディアストリームを停止する
    conn.on("disconnect", () => {
      // この関数内で取得した localStream を停止する
      // Store を経由しないようにする
      if (localStream) {
        for (const track of localStream.getTracks()) {
          track.stop();
        }
      }

      localMediaStream.value = null;
      remoteMediaStream.value = null;
      ayameConnection.value = null;
      window.__ayameDevtoolsPeerConnection = null;
    });

    await conn.connect(localStream);

    ayameConnection.value = conn;
  };

  return (
    <button
      data-testid="connect"
      type="button"
      onClick={(): void => {
        void handleClick();
      }}
      class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
    >
      Connect
    </button>
  );
};

export default ConnectButton;
