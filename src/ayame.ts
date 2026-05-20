import { version as ayameWebSdkVersion } from "../package.json";
import type { ConnectionOptions, Direction, MetadataOption } from "./types";
import { getSelectedCodecs, traceLog } from "./utils";

interface AyameRegisterMessage {
  type: string;
  roomId: string;
  clientId: string;
  key?: string;
  authnMetadata?: unknown;
  standalone?: boolean;
}

export interface AyameAddStreamEvent {
  type: string;
  stream: MediaStream;
}

interface AyameDisconnectEvent {
  reason: string;
  error?: unknown;
}

interface AyameOpenEvent {
  authzMetadata: unknown;
}

interface AyameSignalingMessage {
  type: string;
  authzMetadata?: unknown;
  iceServers?: RTCIceServer[];
  isExistUser?: boolean;
  reason?: string;
  ice?: RTCIceCandidateInit;
  sdp?: string;
}

function isSignalingMessage(value: unknown): value is AyameSignalingMessage {
  if (typeof value !== "object" || value === null || !("type" in value)) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return typeof record.type === "string";
}

interface AyameCallbacks {
  addstream: (event: AyameAddStreamEvent) => void;
  /** ピア終了の通知。セッション解放は disconnect で行う。bye コールバック内で disconnect() を呼び出してはならない。 */
  bye: (event: MessageEvent) => void;
  connect: () => void;
  datachannel: (dataChannel: RTCDataChannel) => void;
  disconnect: (event: AyameDisconnectEvent) => void;
  open: (event: AyameOpenEvent) => void;
}

const POLLING_INTERVAL_MS = 200;

class Connection {
  private debug: boolean;
  private roomId: string;
  private signalingUrl: string;
  private options: ConnectionOptions;
  private connectionState: string;
  private stream: MediaStream | null;
  private remoteStream: MediaStream | null;
  private authnMetadata: unknown;
  private authzMetadata: unknown;
  private ws: WebSocket | null;
  private pc: RTCPeerConnection | null;
  private callbacks: AyameCallbacks;
  private isOffer: boolean;
  private isExistUser: boolean;
  private dataChannels: RTCDataChannel[];
  private pcConfig: {
    iceServers: RTCIceServer[];
    iceTransportPolicy: RTCIceTransportPolicy;
  };

  get webSocket(): WebSocket | null {
    return this.ws;
  }

  get peerConnection(): RTCPeerConnection | null {
    return this.pc;
  }

  on<K extends keyof AyameCallbacks>(kind: K, handler: AyameCallbacks[K]): void {
    this.callbacks[kind] = handler;
  }

  /**
   * オブジェクトを生成し、リモートのピアまたはサーバーに接続します。
   */
  constructor(
    signalingUrl: string,
    roomId: string,
    options: ConnectionOptions,
    debug = false,
    isRelay = false,
  ) {
    this.debug = debug;
    this.roomId = roomId;
    this.signalingUrl = signalingUrl;
    this.options = options;
    this.stream = null;
    this.remoteStream = null;
    this.pc = null;
    this.ws = null;
    this.authnMetadata = null;
    this.authzMetadata = null;
    this.dataChannels = [];
    this.isOffer = false;
    this.isExistUser = false;
    this.connectionState = "new";
    this.pcConfig = {
      iceServers: this.options.iceServers,
      iceTransportPolicy: isRelay ? "relay" : "all",
    };
    this.callbacks = {
      addstream: (): void => {},
      bye: (): void => {},
      connect: (): void => {},
      datachannel: (): void => {},
      disconnect: (): void => {},
      open: (): void => {},
    };
  }

  /**
   * 接続する
   */
  public async connect(
    stream: MediaStream | null,
    metadataOption: MetadataOption | null = null,
  ): Promise<void> {
    if (this.ws) {
      this.traceLog("WebSocket Already Exists!");
      throw new Error("WebSocket Already Exists!");
    }

    if (this.pc) {
      this.traceLog("RTCPeerConnection already exists");
      throw new Error("RTCPeerConnection Already Exists!");
    }

    this.stream = stream;
    if (metadataOption !== null) {
      this.authnMetadata = metadataOption.authnMetadata;
    }
    await this.signaling();
  }

  /**
   * 接続を切断する
   */
  public async disconnect(): Promise<void> {
    // DataChannel を閉じる
    const closePromises = this.dataChannels.map(async (dataChannel) =>
      this.closeDataChannel(dataChannel),
    );
    await Promise.all(closePromises);
    // WebSocket と PeerConnection を閉じる
    await Promise.all([this.closePeerConnection(), this.closeWebSocketConnection()]);

    // 状態の初期化
    this.authzMetadata = null;
    this.isOffer = false;
    this.isExistUser = false;
    this.dataChannels = [];
    this.connectionState = "new";
    this.remoteStream = null;
  }

  /**
   * 統計情報を取得する
   */
  public async getStats(): Promise<RTCStatsReport> {
    if (!this.pc) {
      throw new Error("PeerConnection is not ready");
    }
    return this.pc.getStats();
  }

  private async signaling(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (this.ws) {
        reject(new Error("WS-ALREADY-EXISTS"));
        return;
      }
      this.ws = new WebSocket(this.signalingUrl);
      this.ws.onclose = (): void => {
        if (this.options.standalone !== true) {
          void this.disconnect();
          this.callbacks.disconnect({
            reason: "WS-CLOSED",
          });
          reject(new Error("WS-CLOSED"));
          return;
        }
      };
      this.ws.onerror = (): void => {
        void this.disconnect();
        reject(new Error("WS-CLOSED-WITH-ERROR"));
      };
      this.ws.onopen = (): void => {
        const registerMessage: AyameRegisterMessage = {
          authnMetadata: undefined,
          clientId: this.options.clientId,
          key: undefined,
          roomId: this.roomId,
          standalone: this.options.standalone,
          type: "register",
        };
        if (this.authnMetadata !== null) {
          registerMessage.authnMetadata = this.authnMetadata;
        }
        if (this.options.signalingKey !== undefined) {
          registerMessage.key = this.options.signalingKey;
        }
        this.sendWs(registerMessage);
        if (this.ws) {
          this.ws.onmessage = (event: MessageEvent): void => {
            try {
              if (typeof event.data !== "string") {
                return;
              }
              const parsed: unknown = JSON.parse(String(event.data));
              if (!isSignalingMessage(parsed)) {
                return;
              }
              const message = parsed;
              if (message.type === "ping") {
                this.sendWs({
                  type: "pong",
                });
              } else if (message.type === "bye") {
                this.callbacks.bye(event);
                void this.disconnect()
                  .then(() => {
                    this.callbacks.disconnect({ reason: "BYE" });
                  })
                  .catch(() => {
                    this.callbacks.disconnect({ reason: "BYE" });
                  });
                resolve();
                return;
              } else if (message.type === "accept") {
                this.authzMetadata = message.authzMetadata;
                if (Array.isArray(message.iceServers) && message.iceServers.length > 0) {
                  this.traceLog("iceServers=>", message.iceServers);
                  this.pcConfig.iceServers = message.iceServers;
                }
                this.traceLog("isExistUser=>", String(message.isExistUser));
                this.isExistUser = message.isExistUser ?? false;
                this.createPeerConnection();
                if (this.isExistUser) {
                  void this.sendOffer();
                }
                resolve();
                return;
              } else if (message.type === "reject") {
                void this.disconnect();
                this.callbacks.disconnect({
                  reason: message.reason ?? "REJECTED",
                });
                reject(new Error("REJECTED"));
                return;
              } else if (message.type === "offer") {
                if (this.pc?.signalingState === "have-local-offer") {
                  this.createPeerConnection();
                }
                void this.setOffer(
                  new RTCSessionDescription({
                    sdp: message.sdp,
                    type: "offer",
                  }),
                );
              } else if (message.type === "answer") {
                void this.setAnswer(
                  new RTCSessionDescription({
                    sdp: message.sdp,
                    type: "answer",
                  }),
                );
              } else if (message.type === "candidate" && message.ice !== undefined) {
                this.traceLog("Received ICE candidate ...", message.ice);
                const candidate = new RTCIceCandidate(message.ice);
                void this.addIceCandidate(candidate);
              }
            } catch (error) {
              void this.disconnect();
              this.callbacks.disconnect({
                error,
                reason: "SIGNALING-ERROR",
              });
            }
          };
        }
      };
    });
  }

  public async removeDataChannel(label: string): Promise<void> {
    const dataChannel = this.findDataChannel(label);
    if (dataChannel?.readyState === "open") {
      await this.closeDataChannel(dataChannel);
    } else {
      throw new Error("data channel is not exist or open");
    }
  }

  private setCodecPreferences(
    kind: "audio" | "video",
    codecMimeType: string,
    capabilities: RTCRtpCapabilities,
    transceiver: RTCRtpTransceiver,
  ): void {
    this.traceLog(`${kind} codecMimeType=`, codecMimeType);
    // 指定されたコーデックが存在しない場合は return で返す
    if (!capabilities.codecs.some((codec) => codec.mimeType === codecMimeType)) {
      return;
    }

    // CodecPreferences が設定できない場合は return で返す
    if (typeof transceiver.setCodecPreferences !== "function") {
      return;
    }

    const codecs = getSelectedCodecs(kind, codecMimeType, capabilities.codecs);
    this.traceLog(`${kind} codecs=`, codecs);
    transceiver.setCodecPreferences(codecs);
  }

  private createPeerConnection(): void {
    if (this.pc) {
      this.remoteStream = null;
    }
    this.traceLog("RTCConfiguration=>", this.pcConfig);

    const pc = new RTCPeerConnection(this.pcConfig);

    // Sendrecv / sendonly が指定されている場合は setCodecPreferences を試みる
    if (this.stream && this.options.audio.direction !== "recvonly") {
      // そもそも audioTracks が 0 じゃないかどうか確認する
      const audioTracks = this.stream.getAudioTracks();
      if (audioTracks.length > 0) {
        const audioTrack = audioTracks[0];
        const audioSender = pc.addTrack(audioTrack, this.stream);
        const audioTransceiver = this.getTransceiver(pc, audioSender);
        if (audioTransceiver) {
          audioTransceiver.direction = this.options.audio.direction;
        }
        const audioCapabilities = RTCRtpSender.getCapabilities("audio");
        // コーデックが指定されていた場合は setCodecPreferences を試みる
        if (
          this.options.audio.enabled &&
          this.options.audio.codecMimeType !== undefined &&
          audioTransceiver !== null &&
          audioCapabilities !== null
        ) {
          this.setCodecPreferences(
            "audio",
            this.options.audio.codecMimeType,
            audioCapabilities,
            audioTransceiver,
          );
        }
      }
      // 基本的に受信側はコーデック指定はしないほうがいい
      // Recvonly で audio が有効な場合、
    } else if (this.options.audio.enabled) {
      const audioTransceiver = pc.addTransceiver("audio", {
        direction: this.options.audio.direction,
      });
      const audioCapabilities = RTCRtpReceiver.getCapabilities("audio");
      // コーデックが指定されていた場合は setCodecPreferences を試みる
      if (this.options.audio.codecMimeType !== undefined && audioCapabilities !== null) {
        // コーデックを指定された場合は受信出来るかどうかの確認をする
        this.setCodecPreferences(
          "audio",
          this.options.audio.codecMimeType,
          audioCapabilities,
          audioTransceiver,
        );
      }
    }

    // Sendrecv / sendonly が指定されている場合は setCodecPreferences を試みる
    if (this.stream && this.options.video.direction !== "recvonly") {
      // そもそも videoTracks が 0 じゃないかどうか確認する
      const videoTracks = this.stream.getVideoTracks();
      if (videoTracks.length > 0) {
        const videoTrack = videoTracks[0];
        const videoSender = pc.addTrack(videoTrack, this.stream);
        const videoTransceiver = this.getTransceiver(pc, videoSender);
        if (videoTransceiver) {
          videoTransceiver.direction = this.options.video.direction;
        }
        const videoCapabilities = RTCRtpSender.getCapabilities("video");
        // コーデックが指定されていた場合は setCodecPreferences を試みる
        if (
          this.options.video.enabled &&
          this.options.video.codecMimeType !== undefined &&
          videoTransceiver !== null &&
          videoCapabilities !== null
        ) {
          this.setCodecPreferences(
            "video",
            this.options.video.codecMimeType,
            videoCapabilities,
            videoTransceiver,
          );
        }
      }
      // 基本的に受信側はコーデック指定はしないほうがいい
      // Recvonly で video が有効な場合、
    } else if (this.options.video.enabled) {
      const videoTransceiver = pc.addTransceiver("video", {
        direction: this.options.video.direction,
      });
      const videoCapabilities = RTCRtpReceiver.getCapabilities("video");
      // コーデックが指定されていた場合は setCodecPreferences を試みる
      if (this.options.video.codecMimeType !== undefined && videoCapabilities !== null) {
        this.setCodecPreferences(
          "video",
          this.options.video.codecMimeType,
          videoCapabilities,
          videoTransceiver,
        );
      }
    }

    pc.ontrack = (event: RTCTrackEvent): void => {
      // すでに remoteStream がある場合はなにもしない
      if (this.remoteStream) {
        return;
      }
      this.traceLog("peer.ontrack()", event);
      this.remoteStream = event.streams[0];
      const callbackEvent: AyameAddStreamEvent = {
        stream: this.remoteStream,
        type: "addstream",
      };
      this.callbacks.addstream(callbackEvent);
    };
    pc.onicecandidate = (event: RTCPeerConnectionIceEvent): void => {
      this.traceLog("peer.onicecandidate()", event);
      if (event.candidate) {
        this.sendIceCandidate(event.candidate);
      } else {
        this.traceLog("empty ice event", "");
      }
    };
    pc.oniceconnectionstatechange = (): void => {
      this.traceLog("ICE connection Status has changed to ", pc.iceConnectionState);
      if (this.connectionState !== pc.iceConnectionState) {
        this.connectionState = pc.iceConnectionState;
        switch (this.connectionState) {
          case "connected": {
            this.isOffer = false;
            this.callbacks.connect();
            break;
          }
          case "disconnected":
          case "failed": {
            void this.disconnect();
            this.callbacks.disconnect({
              reason: "ICE-CONNECTION-STATE-FAILED",
            });
            break;
          }
        }
      }
    };
    pc.onconnectionstatechange = (): void => {
      if (pc.connectionState === "connected") {
        if (this.options.standalone === true) {
          this.sendWs({
            type: "connected",
          });
          if (this.ws) {
            this.traceLog("websocket is closed");
            this.ws.close();
            this.ws = null;
          }
        }
      } else if (pc.connectionState === "closed") {
        this.traceLog("peer connection is closed");
        void this.disconnect();
      }
    };
    pc.onsignalingstatechange = (): void => {
      this.traceLog("signaling state changes:", pc.signalingState);
    };
    pc.ondatachannel = this.onDataChannel.bind(this);
    if (!this.pc) {
      this.pc = pc;
      this.callbacks.open({
        authzMetadata: this.authzMetadata,
      });
    } else {
      this.pc = pc;
    }
  }

  public async createDataChannel(
    label: string,
    options: RTCDataChannelInit | undefined,
  ): Promise<RTCDataChannel | null> {
    return new Promise<RTCDataChannel | null>((resolve, reject) => {
      if (!this.pc) {
        reject(new Error("PeerConnection Does Not Ready"));
        return;
      }
      if (this.isOffer) {
        reject(new Error("PeerConnection Has Local Offer"));
        return;
      }
      let dataChannel = this.findDataChannel(label);
      if (dataChannel) {
        reject(new Error("DataChannel Already Exists!"));
        return;
      }
      if (this.isExistUser) {
        dataChannel = this.pc.createDataChannel(label, options);
        dataChannel.onclose = (event: Event): void => {
          this.traceLog("datachannel onclosed=>", event);
          this.dataChannels = this.dataChannels.filter((dc) => dc.label !== label);
        };
        dataChannel.onerror = (event: Event): void => {
          this.traceLog("datachannel onerror=>", event);
          this.dataChannels = this.dataChannels.filter((dc) => dc.label !== label);
        };
        dataChannel.onmessage = (event: MessageEvent): void => {
          this.traceLog("datachannel onmessage=>", String(event.data));
        };
        dataChannel.onopen = (event: Event): void => {
          this.traceLog("datachannel onopen=>", event);
        };
        this.dataChannels.push(dataChannel);
        resolve(dataChannel);
        return;
      }
      resolve(null);
    });
  }

  private onDataChannel(event: RTCDataChannelEvent): void {
    this.traceLog("on data channel", event);
    if (!this.pc) {
      return;
    }
    const dataChannel = event.channel;
    const { label } = event.channel;
    if (label.length === 0) {
      return;
    }
    dataChannel.onopen = (event: Event): void => {
      this.traceLog("datachannel onopen=>", event);
    };
    dataChannel.onclose = (event: Event): void => {
      this.traceLog("datachannel onclosed=>", event);
    };
    dataChannel.onerror = (event: Event): void => {
      this.traceLog("datachannel onerror=>", event);
    };
    dataChannel.onmessage = (event: MessageEvent): void => {
      this.traceLog("datachannel onmessage=>", String(event.data));
    };
    if (!this.findDataChannel(label)) {
      this.dataChannels.push(event.channel);
    } else {
      this.dataChannels = this.dataChannels.map((channel) => {
        if (channel.label === label) {
          return dataChannel;
        }
        return channel;
      });
    }
    this.callbacks.datachannel(dataChannel);
  }

  private async sendOffer(): Promise<void> {
    if (!this.pc) {
      return;
    }

    const offer = await this.pc.createOffer({
      offerToReceiveAudio:
        this.options.audio.enabled && this.options.audio.direction !== "sendonly",
      offerToReceiveVideo:
        this.options.video.enabled && this.options.video.direction !== "sendonly",
    });
    this.traceLog("create offer sdp, sdp=", offer.sdp ?? "");
    await this.pc.setLocalDescription(offer);
    if (this.pc.localDescription) {
      this.sendSdp(this.pc.localDescription);
    }
    this.isOffer = true;
  }

  private async createAnswer(): Promise<void> {
    if (!this.pc) {
      return;
    }
    try {
      const answer = await this.pc.createAnswer();
      this.traceLog("create answer sdp, sdp=", answer.sdp ?? "");
      await this.pc.setLocalDescription(answer);
      if (this.pc.localDescription) {
        this.sendSdp(this.pc.localDescription);
      }
    } catch (error) {
      await this.disconnect();
      this.callbacks.disconnect({
        error,
        reason: "CREATE-ANSWER-ERROR",
      });
    }
  }

  private async setAnswer(sessionDescription: RTCSessionDescription): Promise<void> {
    if (!this.pc) {
      return;
    }
    await this.pc.setRemoteDescription(sessionDescription);
    this.traceLog("set answer sdp=", sessionDescription.sdp);
  }

  private async setOffer(sessionDescription: RTCSessionDescription): Promise<void> {
    try {
      if (!this.pc) {
        return;
      }
      await this.pc.setRemoteDescription(sessionDescription);
      this.traceLog("set offer sdp=", sessionDescription.sdp);
      await this.createAnswer();
    } catch (error) {
      await this.disconnect();
      this.callbacks.disconnect({
        error,
        reason: "SET-OFFER-ERROR",
      });
    }
  }

  private async addIceCandidate(candidate: RTCIceCandidate): Promise<void> {
    try {
      if (this.pc) {
        await this.pc.addIceCandidate(candidate);
      }
    } catch {
      this.traceLog("invalid ice candidate", candidate);
    }
  }

  private sendIceCandidate(candidate: RTCIceCandidate): void {
    const message = {
      ice: candidate,
      type: "candidate",
    };
    this.sendWs(message);
  }

  private sendSdp(sessionDescription: RTCSessionDescription): void {
    this.sendWs(sessionDescription);
  }

  private sendWs(message: object): void {
    if (this.ws) {
      this.ws.send(JSON.stringify(message));
    }
  }

  private getTransceiver(pc: RTCPeerConnection, sender: RTCRtpSender): RTCRtpTransceiver | null {
    let transceiver = null;
    for (const t of pc.getTransceivers()) {
      if (t.sender === sender) {
        transceiver = t;
      }
    }
    if (!transceiver) {
      throw new Error("invalid transceiver");
    }
    return transceiver;
  }

  private findDataChannel(label: string): RTCDataChannel | undefined {
    return this.dataChannels.find((channel) => channel.label === label);
  }

  private async closeDataChannel(dataChannel: RTCDataChannel): Promise<void> {
    this.traceLog("close data channel");
    return new Promise((resolve) => {
      if (dataChannel.readyState === "closed") {
        this.traceLog("data channel is closed");
        resolve();
        return;
      }
      dataChannel.onclose = null;
      const timerId = setInterval(() => {
        if (dataChannel.readyState === "closed") {
          clearInterval(timerId);
          this.traceLog("data channel is closed");
          resolve();
        }
      }, POLLING_INTERVAL_MS);
      dataChannel.close();
    });
  }

  private async closePeerConnection(): Promise<void> {
    this.traceLog("close peer connection");
    return new Promise<void>((resolve) => {
      if (!this.pc) {
        this.traceLog("peer connection is null");
        resolve();
        return;
      }
      if (this.pc.connectionState === "closed") {
        this.pc = null;
        this.traceLog("peer connection is closed");
        resolve();
        return;
      }
      this.pc.oniceconnectionstatechange = null;
      const timerId = setInterval(() => {
        if (!this.pc) {
          clearInterval(timerId);
          this.traceLog("peer connection is null");
          resolve();
          return;
        }
        if (this.pc.connectionState === "closed") {
          this.pc = null;
          clearInterval(timerId);
          this.traceLog("peer connection is closed");
          resolve();
        }
      }, POLLING_INTERVAL_MS);
      this.pc.close();
    });
  }

  private async closeWebSocketConnection(): Promise<void> {
    return new Promise<void>((resolve) => {
      // WS がない場合はすでに閉じられているので resolve
      if (!this.ws) {
        this.traceLog("websocket is null");
        resolve();
        return;
      }
      // WS がすでに閉じられている場合は resolve
      if (this.ws.readyState === WebSocket.CLOSED) {
        this.ws = null;
        this.traceLog("websocket is closed");
        resolve();
        return;
      }
      // WS の onclose を null 入れる
      this.ws.onclose = null;
      // WS が閉じられるまで待つ
      const timerId = setInterval(() => {
        // WS がない場合はすでに閉じられているので resolve
        if (!this.ws) {
          clearInterval(timerId);
          this.traceLog("websocket is null");
          resolve();
          return;
        }
        // WS が閉じられている場合は resolve
        if (this.ws.readyState === WebSocket.CLOSED) {
          this.ws = null;
          clearInterval(timerId);
          this.traceLog("websocket is closed");
          resolve();
        }
      }, POLLING_INTERVAL_MS);
      // WS を閉じる
      this.ws.close();
    });
  }

  private traceLog(
    title: string,
    message?:
      | Record<string, unknown>
      | string
      | RTCRtpCodecCapability[]
      | RTCIceServer[]
      | RTCIceCandidateInit
      | Event,
  ): void {
    if (!this.debug) {
      return;
    }
    traceLog(title, message);
  }
}

export default Connection;

/**
 * Ayame Connection のデフォルトのオプションを新規生成します。
 * 呼び出しごとに新しいオブジェクトを返します。
 */
export const createDefaultOptions = (): ConnectionOptions => ({
  audio: {
    codecMimeType: undefined,
    direction: "sendrecv",
    enabled: true,
  },
  clientId: crypto.randomUUID(),
  iceServers: [],
  signalingKey: undefined,
  standalone: undefined,
  video: {
    codecMimeType: undefined,
    direction: "sendrecv",
    enabled: true,
  },
});

/**
 * Ayame Connection のデフォルトのオプションです。
 */
export const defaultOptions: ConnectionOptions = {
  audio: {
    direction: "sendrecv",
    enabled: true,
  },
  clientId: crypto.randomUUID(),
  iceServers: [],
  video: {
    direction: "sendrecv",
    enabled: true,
  },
};

/**
 * Ayame Connection を生成します。
 * @deprecated この関数は廃止予定です。代わりに createConnection を使用してください。
 */
export const connection = (
  signalingUrl: string,
  roomId: string,
  options: ConnectionOptions = defaultOptions,
  debug = false,
  isRelay = false,
): Connection => new Connection(signalingUrl, roomId, options, debug, isRelay);

/**
 * Ayame Connection を生成します。
 */
export const createConnection = (
  signalingUrl: string,
  roomId: string,
  options: ConnectionOptions = createDefaultOptions(),
  debug = false,
  isRelay = false,
): Connection => new Connection(signalingUrl, roomId, options, debug, isRelay);

/**
 * Ayame Web SDK のバージョンを出力します。
 */
export const version = (): string => ayameWebSdkVersion;

export type { Connection, ConnectionOptions, Direction, MetadataOption };
export { getAvailableCodecs } from "./utils";
