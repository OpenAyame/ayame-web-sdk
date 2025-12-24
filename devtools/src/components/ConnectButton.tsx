import { createConnection, defaultOptions } from "@open-ayame/ayame-web-sdk";
import type { AyameAddStreamEvent } from "@open-ayame/ayame-web-sdk";
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

const ConnectButton = () => {
  const handleClick = async () => {
    const options = defaultOptions;
    options.audio.enabled = audioEnabled.value;
    options.audio.direction = audioDirection.value;
    options.audio.codecMimeType = audioCodecMimeType.value;
    options.video.enabled = videoEnabled.value;
    options.video.direction = videoDirection.value;
    options.video.codecMimeType = videoCodecMimeType.value;
    options.signalingKey = signalingKey.value;

    const conn = createConnection(signalingUrl.value, roomId.value, options, debug.value);

    let localStream: MediaStream | null = null;

    if (
      (audioEnabled.value && audioDirection.value !== "recvonly") ||
      (videoEnabled.value && videoDirection.value !== "recvonly")
    ) {
      let videoConstraints: boolean | MediaTrackConstraints = videoEnabled.value;
      if (
        videoEnabled.value &&
        videoResolution.value &&
        videoResolution.value !== "undefined"
      ) {
        const [width, height] = videoResolution.value.split("x").map(Number);
        if (width && height) {
          videoConstraints = {
            width: {
              ideal: width,
            },
            height: {
              ideal: height,
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
      pc.onconnectionstatechange = () => {
        ayameConnectionState.value = pc.connectionState;
      };
    });

    // 切断時にローカルとリモートのメディアストリームを停止する
    conn.on("disconnect", () => {
      // この関数内で取得した localStream を停止する
      // store を経由しないようにする
      if (localStream) {
        for (const track of localStream.getTracks()) {
          track.stop();
        }
      }

      localMediaStream.value = null;
      remoteMediaStream.value = null;
      ayameConnection.value = null;
    });

    await conn.connect(localStream);

    ayameConnection.value = conn;
  };

  return (
    <button data-testid="connect" type="button" onClick={handleClick}>
      Connect
    </button>
  );
};

export default ConnectButton;
