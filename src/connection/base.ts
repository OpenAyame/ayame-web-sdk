/* @private */
import { traceLog, getVideoCodecsFromString, removeCodec, browser } from '../utils';
import { ConnectionOptions, VideoCodecOption } from './options';

/**
 * @ignore
 */
interface AyameRegisterMessage {
  type: string;
  roomId: string;
  clientId: string;
  key?: string;
  authnMetadata?: any;
}

/**
 * @ignore
 */
class ConnectionBase {
  debug: boolean;
  roomId: string;
  signalingUrl: string;
  options: ConnectionOptions;
  connectionState: string;
  stream: MediaStream | null;
  remoteStream: MediaStream | null;
  authnMetadata: any;
  authzMetadata: any;
  _ws: WebSocket | null;
  _pc: RTCPeerConnection | null;
  _callbacks: any;
  _removeCodec: boolean;
  _isOffer: boolean;
  _isExistUser: boolean;
  _dataChannels: Array<RTCDataChannel>;
  _pcConfig: {
    iceServers: Array<RTCIceServer>;
    iceTransportPolicy: RTCIceTransportPolicy;
  };

  /**
   * @ignore
   */
  on(kind: string, callback: Function): void {
    if (kind in this._callbacks) {
      this._callbacks[kind] = callback;
    }
  }

  /**
   * オブジェクトを生成し、リモートのピアまたはサーバーに接続します。
   * @param signalingUrl シグナリングに利用する URL
   * @param roomId Ayame のルームID
   * @param options Ayame の接続オプション
   * @param [debug=false] デバッグログの出力可否
   * @param [isRelay=false] iceTransportPolicy を強制的に relay にするか
   * @listens {open} Ayame Server に accept され、PeerConnection が生成されると送信されます。
   * @listens {connect} PeerConnection が接続されると送信されます。
   * @listens {disconnect} PeerConnection が切断されると送信されます。
   * @listens {addstream} リモートのストリームが追加されると送信されます。
   * @listens {removestream} リモートのストリームが削除されると送信されます。
   * @listens {bye} Ayame Server から bye を受信すると送信されます。
   */
  constructor(signalingUrl: string, roomId: string, options: ConnectionOptions, debug = false, isRelay = false) {
    this.debug = debug;
    this.roomId = roomId;
    this.signalingUrl = signalingUrl;
    this.options = options;
    this._removeCodec = false;
    this.stream = null;
    this.remoteStream = null;
    this._pc = null;
    this._ws = null;
    this.authnMetadata = null;
    this.authzMetadata = null;
    this._dataChannels = [];
    this._isOffer = false;
    this._isExistUser = false;
    this.connectionState = 'new';
    this._pcConfig = {
      iceServers: this.options.iceServers,
      iceTransportPolicy: isRelay ? 'relay' : 'all'
    };
    this._callbacks = {
      open: () => {},
      connect: () => {},
      disconnect: () => {},
      addstream: () => {},
      removestream: () => {},
      bye: () => {},
      data: () => {}
    };
  }

  async _disconnect(): Promise<void> {
    await this._dataChannels.forEach(async (dataChannel: RTCDataChannel) => {
      await this._closeDataChannel(dataChannel);
    });
    await this._closePeerConnection();
    await this._closeWebSocketConnection();
    this.authzMetadata = null;
    this._removeCodec = false;
    this._isOffer = false;
    this._isExistUser = false;
    this._dataChannels = [];
    this.connectionState = 'new';
  }

  async _signaling(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (this._ws) {
        return reject('WS-ALREADY-EXISTS');
      }
      this._ws = new WebSocket(this.signalingUrl);
      this._ws.onclose = async () => {
        await this._disconnect();
        return reject('WS-CLOSED');
      };
      this._ws.onerror = async () => {
        await this._disconnect();
        return reject('WS-CLOSED-WITH-ERROR');
      };
      this._ws.onopen = () => {
        const registerMessage: AyameRegisterMessage = {
          type: 'register',
          roomId: this.roomId,
          clientId: this.options.clientId,
          authnMetadata: undefined,
          key: undefined
        };
        if (this.authnMetadata !== null) {
          registerMessage.authnMetadata = this.authnMetadata;
        }
        if (this.options.signalingKey !== null) {
          registerMessage.key = this.options.signalingKey;
        }
        this._sendWs(registerMessage);
        if (this._ws) {
          this._ws.onmessage = async (event: MessageEvent) => {
            try {
              if (typeof event.data !== 'string') {
                return;
              }
              const message = JSON.parse(event.data);
              if (message.type === 'ping') {
                this._sendWs({ type: 'pong' });
              } else if (message.type === 'bye') {
                this._callbacks.bye(event);
                await this._disconnect();
                return resolve();
              } else if (message.type === 'accept') {
                this.authzMetadata = message.authzMetadata;
                if (Array.isArray(message.iceServers) && message.iceServers.length > 0) {
                  this._traceLog('iceServers=>', message.iceServers);
                  this._pcConfig.iceServers = message.iceServers;
                }
                if (message.isExistUser === undefined) {
                  if (!this._pc) {
                    this._createPeerConnection();
                  }
                  await this._sendOffer();
                } else {
                  this._traceLog('isExistUser=>', message.isExistUser);
                  this._isExistUser = message.isExistUser;
                  this._createPeerConnection();
                  if (this._isExistUser === true) {
                    await this._sendOffer();
                  }
                }
                return resolve();
              } else if (message.type === 'reject') {
                await this._disconnect();
                this._callbacks.disconnect({ reason: message.reason || 'REJECTED' });
                return reject('REJECTED');
              } else if (message.type === 'offer') {
                if (this._pc && this._pc.signalingState === 'have-local-offer') {
                  this._createPeerConnection();
                }
                this._setOffer(new RTCSessionDescription(message));
              } else if (message.type === 'answer') {
                await this._setAnswer(new RTCSessionDescription(message));
              } else if (message.type === 'candidate') {
                if (message.ice) {
                  this._traceLog('Received ICE candidate ...', message.ice);
                  const candidate = new RTCIceCandidate(message.ice);
                  this._addIceCandidate(candidate);
                }
              }
            } catch (error) {
              await this._disconnect();
              this._callbacks.disconnect({ reason: 'SIGNALING-ERROR', error: error });
            }
          };
        }
      };
    });
  }

  _createPeerConnection(): void {
    this._traceLog('RTCConfiguration=>', this._pcConfig);
    const pc = new RTCPeerConnection(this._pcConfig);
    const audioTrack = this.stream && this.stream.getAudioTracks()[0];
    if (audioTrack && this.options.audio.direction !== 'recvonly') {
      pc.addTrack(audioTrack, this.stream!);
    } else if (this.options.audio.enabled) {
      pc.addTransceiver('audio', { direction: 'recvonly' });
    }
    const videoTrack = this.stream && this.stream.getVideoTracks()[0];
    if (videoTrack && this.options.video.direction !== 'recvonly') {
      const videoSender = pc.addTrack(videoTrack, this.stream!);
      const videoTransceiver = this._getTransceiver(pc, videoSender);
      if (this._isVideoCodecSpecified() && videoTransceiver !== null) {
        if (typeof videoTransceiver.setCodecPreferences !== 'undefined') {
          const videoCapabilities = RTCRtpSender.getCapabilities('video');
          if (videoCapabilities) {
            let videoCodecs = [];
            if (this.options.video.codec) {
              videoCodecs = getVideoCodecsFromString(this.options.video.codec, videoCapabilities.codecs);
            }
            this._traceLog('video codecs=', videoCodecs);
            videoTransceiver.setCodecPreferences(videoCodecs);
          }
        } else {
          this._removeCodec = true;
        }
      }
    } else if (this.options.video.enabled) {
      const videoTransceiver = pc.addTransceiver('video', { direction: 'recvonly' });
      if (this._isVideoCodecSpecified()) {
        if (typeof videoTransceiver.setCodecPreferences !== 'undefined') {
          const videoCapabilities = RTCRtpSender.getCapabilities('video');
          if (videoCapabilities) {
            let videoCodecs = [];
            if (this.options.video.codec) {
              videoCodecs = getVideoCodecsFromString(this.options.video.codec, videoCapabilities.codecs);
            }
            this._traceLog('video codecs=', videoCodecs);
            videoTransceiver.setCodecPreferences(videoCodecs);
          }
        } else {
          this._removeCodec = true;
        }
      }
    }
    const tracks: Array<MediaStreamTrack> = [];
    pc.ontrack = (event: RTCTrackEvent) => {
      const callbackEvent: any = event;
      this._traceLog('peer.ontrack()', event);
      if (browser() === 'safari') {
        tracks.push(event.track);
        const mediaStream = new MediaStream(tracks);
        this.remoteStream = mediaStream;
      } else {
        this.remoteStream = event.streams[0];
      }
      callbackEvent.stream = this.remoteStream;
      this._callbacks.addstream(callbackEvent);
    };
    pc.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
      this._traceLog('peer.onicecandidate()', event);
      if (event.candidate) {
        this._sendIceCandidate(event.candidate);
      } else {
        this._traceLog('empty ice event', '');
      }
    };
    pc.oniceconnectionstatechange = async () => {
      this._traceLog('ICE connection Status has changed to ', pc.iceConnectionState);
      if (this.connectionState !== pc.iceConnectionState) {
        this.connectionState = pc.iceConnectionState;
        switch (this.connectionState) {
          case 'connected':
            this._isOffer = false;
            this._callbacks.connect();
            break;
          case 'disconnected':
          case 'failed':
            await this._disconnect();
            this._callbacks.disconnect({ reason: 'ICE-CONNECTION-STATE-FAILED' });
            break;
        }
      }
    };
    pc.onsignalingstatechange = _ => {
      this._traceLog('signaling state changes:', pc.signalingState);
    };
    pc.ondatachannel = this._onDataChannel.bind(this);
    if (!this._pc) {
      this._pc = pc;
      this._callbacks.open({ authzMetadata: this.authzMetadata });
    } else {
      this._pc = pc;
    }
  }

  async _addDataChannel(label: string, options: RTCDataChannelInit | undefined): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this._pc) return reject('PeerConnection Does Not Ready');
      if (this._isOffer) return reject('PeerConnection Has Local Offer');
      let dataChannel = this._findDataChannel(label);
      if (dataChannel) {
        return reject('DataChannel Already Exists!');
      }
      dataChannel = this._pc.createDataChannel(label, options);
      dataChannel.onclose = (event: Record<string, any>) => {
        this._traceLog('datachannel onclosed=>', event);
        this._dataChannels = this._dataChannels.filter(dataChannel => dataChannel.label != label);
      };
      dataChannel.onerror = (event: Record<string, any>) => {
        this._traceLog('datachannel onerror=>', event);
        this._dataChannels = this._dataChannels.filter(dataChannel => dataChannel.label != label);
      };
      dataChannel.onmessage = (event: any) => {
        this._traceLog('datachannel onmessage=>', event.data);
        event.label = label;
        this._callbacks.data(event);
      };
      dataChannel.onopen = (event: Record<string, any>) => {
        this._traceLog('datachannel onopen=>', event);
      };
      this._dataChannels.push(dataChannel);
      return resolve();
    });
  }

  _onDataChannel(event: RTCDataChannelEvent): void {
    this._traceLog('on data channel', event);
    if (!this._pc) return;
    const dataChannel = event.channel;
    const label = event.channel.label;
    if (!event.channel) return;
    if (!label || label.length < 1) return;
    dataChannel.onopen = async (event: Record<string, any>) => {
      this._traceLog('datachannel onopen=>', event);
    };
    dataChannel.onclose = async (event: Record<string, any>) => {
      this._traceLog('datachannel onclosed=>', event);
    };
    dataChannel.onerror = async (event: Record<string, any>) => {
      this._traceLog('datachannel onerror=>', event);
    };
    dataChannel.onmessage = (event: any) => {
      this._traceLog('datachannel onmessage=>', event.data);
      event.label = label;
      this._callbacks.data(event);
    };
    if (!this._findDataChannel(label)) {
      this._dataChannels.push(event.channel);
    } else {
      this._dataChannels = this._dataChannels.map(channel => {
        if (channel.label == label) {
          return dataChannel;
        } else {
          return channel;
        }
      });
    }
  }

  async _sendOffer() {
    if (!this._pc) {
      return;
    }
    if (browser() === 'safari') {
      if (this.options.video.enabled && this.options.video.direction === 'sendrecv') {
        this._pc.addTransceiver('video', { direction: 'recvonly' });
      }
      if (this.options.audio.enabled && this.options.audio.direction === 'sendrecv') {
        this._pc.addTransceiver('audio', { direction: 'recvonly' });
      }
    }
    const offer: any = await this._pc.createOffer({
      offerToReceiveAudio: this.options.audio.enabled && this.options.audio.direction !== 'sendonly',
      offerToReceiveVideo: this.options.video.enabled && this.options.video.direction !== 'sendonly'
    });
    if (this._removeCodec && this.options.video.codec) {
      const codecs: Array<VideoCodecOption> = ['VP8', 'VP9', 'H264'];
      codecs.forEach((codec: VideoCodecOption) => {
        if (this.options.video.codec !== codec) {
          offer.sdp = removeCodec(offer.sdp, codec);
        }
      });
    }
    this._traceLog('create offer sdp, sdp=', offer.sdp);
    await this._pc.setLocalDescription(offer);
    if (this._pc.localDescription) {
      this._sendSdp(this._pc.localDescription);
    }
    this._isOffer = true;
  }

  _isVideoCodecSpecified(): boolean {
    return this.options.video.enabled && this.options.video.codec !== null;
  }

  async _createAnswer(): Promise<void> {
    if (!this._pc) {
      return;
    }
    try {
      const answer = await this._pc.createAnswer();
      this._traceLog('create answer sdp, sdp=', answer.sdp);
      await this._pc.setLocalDescription(answer);
      if (this._pc.localDescription) this._sendSdp(this._pc.localDescription);
    } catch (error) {
      await this._disconnect();
      this._callbacks.disconnect({ reason: 'CREATE-ANSWER-ERROR', error: error });
    }
  }

  async _setAnswer(sessionDescription: RTCSessionDescription): Promise<void> {
    if (!this._pc) {
      return;
    }
    await this._pc.setRemoteDescription(sessionDescription);
    this._traceLog('set answer sdp=', sessionDescription.sdp);
  }

  async _setOffer(sessionDescription: RTCSessionDescription): Promise<void> {
    try {
      if (!this._pc) {
        return;
      }
      await this._pc.setRemoteDescription(sessionDescription);
      this._traceLog('set offer sdp=', sessionDescription.sdp);
      await this._createAnswer();
    } catch (error) {
      await this._disconnect();
      this._callbacks.disconnect({ reason: 'SET-OFFER-ERROR', error: error });
    }
  }

  async _addIceCandidate(candidate: RTCIceCandidate): Promise<void> {
    try {
      if (this._pc) {
        await this._pc.addIceCandidate(candidate);
      }
    } catch (_error) {
      this._traceLog('invalid ice candidate', candidate);
    }
  }

  _sendIceCandidate(candidate: RTCIceCandidate): void {
    const message = { type: 'candidate', ice: candidate };
    this._sendWs(message);
  }

  _sendSdp(sessionDescription: RTCSessionDescription): void {
    this._sendWs(sessionDescription);
  }

  _sendWs(message: Record<string, any>) {
    if (this._ws) {
      this._ws.send(JSON.stringify(message));
    }
  }

  _getTransceiver(pc: RTCPeerConnection, track: any): RTCRtpTransceiver | null {
    let transceiver = null;
    pc.getTransceivers().forEach((t: RTCRtpTransceiver) => {
      if (t.sender == track || t.receiver == track) transceiver = t;
    });
    if (!transceiver) {
      throw new Error('invalid transceiver');
    }
    return transceiver;
  }

  _findDataChannel(label: string): RTCDataChannel | undefined {
    return this._dataChannels.find(channel => channel.label == label);
  }

  async _closeDataChannel(dataChannel: RTCDataChannel): Promise<void> {
    return new Promise(resolve => {
      if (dataChannel.readyState === 'closed') return resolve();
      dataChannel.onclose = null;
      const timerId = setInterval(() => {
        if (dataChannel.readyState === 'closed') {
          clearInterval(timerId);
          return resolve();
        }
      }, 400);
      dataChannel && dataChannel.close();
    });
  }

  async _closePeerConnection(): Promise<void> {
    return new Promise<void>(resolve => {
      if (browser() === 'safari' && this._pc) {
        this._pc.oniceconnectionstatechange = () => {};
        this._pc.close();
        this._pc = null;
        return resolve();
      }
      if (!this._pc) return resolve();
      if (this._pc && this._pc.signalingState == 'closed') {
        this._pc = null;
        return resolve();
      }
      this._pc.oniceconnectionstatechange = () => {};
      const timerId = setInterval(() => {
        if (!this._pc) {
          clearInterval(timerId);
          return resolve();
        }
        if (this._pc && this._pc.signalingState == 'closed') {
          this._pc = null;
          clearInterval(timerId);
          return resolve();
        }
      }, 400);
      this._pc.close();
    });
  }

  async _closeWebSocketConnection(): Promise<void> {
    return new Promise<void>(resolve => {
      if (!this._ws) return resolve();
      if (this._ws && this._ws.readyState === 3) {
        this._ws = null;
        return resolve();
      }
      this._ws.onclose = () => {};
      const timerId = setInterval(() => {
        if (!this._ws) {
          clearInterval(timerId);
          return resolve();
        }
        if (this._ws.readyState === 3) {
          this._ws = null;
          clearInterval(timerId);
          return resolve();
        }
      }, 400);
      this._ws && this._ws.close();
    });
  }

  _traceLog(title: string, message?: Record<string, any> | string) {
    if (!this.debug) return;
    traceLog(title, message);
  }
}

export default ConnectionBase;
