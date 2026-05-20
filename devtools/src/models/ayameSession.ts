import { batch, computed, signal } from "@preact/signals";
import { createConnection } from "@open-ayame/ayame-web-sdk";
import type { AyameAddStreamEvent, ConnectionOptions } from "@open-ayame/ayame-web-sdk";
import { mediaConstraints } from "../connectionOptions";
import {
  ayameConnection,
  ayameConnectionState,
  debug,
  localMediaStream,
  remoteMediaStream,
  roomId,
  signalingUrl,
} from "../signals";

export const isConnecting = signal(false);

export const canConnect = computed(
  (): boolean => !isConnecting.value && ayameConnection.value === null,
);

const clearLocalMedia = (stream: MediaStream | null): void => {
  if (!stream) {
    return;
  }
  for (const track of stream.getTracks()) {
    track.stop();
  }
};

const resetSessionSignals = (): void => {
  localMediaStream.value = null;
  remoteMediaStream.value = null;
  ayameConnection.value = null;
  window.__ayameDevtoolsPeerConnection = null;
};

export const disconnectSession = async (): Promise<void> => {
  const conn = ayameConnection.value;
  if (!conn) {
    return;
  }

  clearLocalMedia(localMediaStream.value);
  await conn.disconnect("USER-DISCONNECT");
  resetSessionSignals();
};

export const connectSession = async (options: ConnectionOptions): Promise<void> => {
  if (isConnecting.value) {
    return;
  }

  batch(() => {
    isConnecting.value = true;
  });

  let localStream: MediaStream | null = null;

  try {
    if (ayameConnection.value) {
      await disconnectSession();
    }

    const conn = createConnection(signalingUrl.value, roomId.value, options, debug.value);
    const constraints = mediaConstraints.value;

    if (
      (constraints.audio !== false && constraints.audio !== undefined) ||
      (constraints.video !== false && constraints.video !== undefined)
    ) {
      localStream = await navigator.mediaDevices.getUserMedia(constraints);
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

    conn.on("disconnect", () => {
      clearLocalMedia(localStream);
      resetSessionSignals();
    });

    await conn.connect(localStream);
    ayameConnection.value = conn;
  } catch (error) {
    clearLocalMedia(localStream);
    resetSessionSignals();
    throw error;
  } finally {
    isConnecting.value = false;
  }
};
