/* @flow */
/* @private */
import { traceLog, getVideoCodecsFromString, removeCodec, browser } from '../utils';
import { type ConnectionOptions } from './options';

/**
 * @ignore
 */
class ConnectionBase {
  debug: boolean;
  roomId: string;
  signalingUrl: string;
  options: ConnectionOptions;
  connectionState: string;
  stream: ?window.MediaStream;
  remoteStream: ?window.MediaStream;
  authnMetadata: ?Object;
  signalingKey: ?string;
  authzMetadata: ?Object;
  _ws: ?WebSocket;
  _pc: window.RTCPeerConnection;
  _callbacks: Object;
  _removeCodec: boolean;
  _isOffer: boolean;
  _dataChannels: Array<window.RTCDataChannel>;
  _callbacks: Object;
  _pcConfig: {
    iceServers: Array<Object>
  };

  /**
   * @ignore
   */
  on(kind: string, callback: Function) {
    if (kind in this._callbacks) {
      this._callbacks[kind] = callback;
    }
  }
  constructor(signalingUrl: string, roomId: string, options: ConnectionOptions, debug: boolean = false) {
    this.debug = debug;
    this.roomId = roomId;
    this.signalingUrl = signalingUrl;
    this.options = options;
    this._removeCodec = false;
    this.stream = null;
    this.remoteStream = null;
    this._pc = null;
    this.signalingKey = null;
    this.authnMetadata = null;
    this.authzMetadata = null;
    this._dataChannels = [];
    this._isOffer = false;
    this.connectionState = 'new';
    this._pcConfig = {
      iceServers: this.options.iceServers
    };
    this._callbacks = {
      open: () => {},
      connect: () => {},
      disconnect: () => {},
      addstream: () => {},
      removestream: () => {},
      data: () => {}
    };
  }

  async _disconnect() {
    await this._dataChannels.forEach(async dataChannel => {
      await this._closeDataChannel(dataChannel);
    });
    await this._closePeerConnection();
    await this._closeWebSocketConnection();
    if (this.stream) {
      this.stream.getTracks().forEach(t => {
        t.stop();
      });
    }
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(t => {
        t.stop();
      });
    }
    this.remoteStream = null;
    this.stream = null;
    this.signalingKey = null;
    this.authnMetadata = null;
    this.authzMetadata = null;
    this._ws = null;
    this._pc = null;
    this._removeCodec = false;
    this._isOffer = false;
    this._dataChannels = [];
    this.connectionState = 'new';
  }

  async _signaling() {
    return new Promise((resolve, reject) => {
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
        const registerMessage = {
          type: 'register',
          roomId: this.roomId,
          clientId: this.options.clientId,
          authnMetadata: undefined,
          key: undefined
        };
        if (this.authnMetadata !== null) {
          registerMessage.authnMetadata = this.authnMetadata;
        }
        if (this.signalingKey !== null) {
          registerMessage.key = this.signalingKey;
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
              } else if (message.type === 'close') {
                this._callbacks.close(event);
              } else if (message.type === 'accept') {
                this.authzMetadata = message.authzMetadata;
                if (Array.isArray(message.iceServers) && message.iceServers.length > 0) {
                  this._traceLog('iceServers=>', message.iceServers);
                  this._pcConfig.iceServers = message.iceServers;
                }
                if (!this._pc) this._createPeerConnection();
                await this._sendOffer();
                return resolve();
              } else if (message.type === 'reject') {
                await this._disconnect();
                this._callbacks.disconnect({ reason: 'REJECTED' });
                return reject('REJECTED');
              } else if (message.type === 'offer') {
                this._setOffer(new window.RTCSessionDescription(message));
              } else if (message.type === 'answer') {
                await this._setAnswer(new window.RTCSessionDescription(message));
              } else if (message.type === 'candidate') {
                if (message.ice) {
                  this._traceLog('Received ICE candidate ...', message.ice);
                  const candidate = new window.RTCIceCandidate(message.ice);
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

  _createPeerConnection() {
    const pc = new window.RTCPeerConnection(this._pcConfig);
    const audioTrack = this.stream && this.stream.getAudioTracks()[0];
    if (audioTrack && this.options.audio.direction !== 'recvonly') {
      pc.addTrack(audioTrack, this.stream);
    } else if (this.options.audio.enabled) {
      pc.addTransceiver('audio', { direction: 'recvonly' });
    }
    const videoTrack = this.stream && this.stream.getVideoTracks()[0];
    if (videoTrack && this.options.video.direction !== 'recvonly') {
      const videoSender = pc.addTrack(videoTrack, this.stream);
      const videoTransceiver = this._getTransceiver(pc, videoSender);
      if (this._isVideoCodecSpecified()) {
        if (typeof videoTransceiver.setCodecPreferences !== 'undefined') {
          const videoCapabilities = window.RTCRtpSender.getCapabilities('video');
          const videoCodecs = getVideoCodecsFromString(this.options.video.codec || 'VP9', videoCapabilities.codecs);
          this._traceLog('video codecs=', videoCodecs);
          videoTransceiver.setCodecPreferences(videoCodecs);
        } else {
          this._removeCodec = true;
        }
      }
    } else if (this.options.video.enabled) {
      const videoTransceiver = pc.addTransceiver('video', { direction: 'recvonly' });
      if (this._isVideoCodecSpecified()) {
        if (typeof videoTransceiver.setCodecPreferences !== 'undefined') {
          const videoCapabilities = window.RTCRtpSender.getCapabilities('video');
          const videoCodecs = getVideoCodecsFromString(this.options.video.codec || 'VP9', videoCapabilities.codecs);
          this._traceLog('video codecs=', videoCodecs);
          videoTransceiver.setCodecPreferences(videoCodecs);
        } else {
          this._removeCodec = true;
        }
      }
    }
    pc.ontrack = (event: window.RTCTrackEvent) => {
      let tracks = [];
      this._traceLog('peer.ontrack()', event);
      if (browser() === 'safari') {
        tracks.push(event.track);
        let mediaStream = new window.MediaStream(tracks);
        this.remoteStream = mediaStream;
      } else {
        this.remoteStream = event.streams[0];
      }
      event.stream = this.remoteStream;
      this._callbacks.addstream(event);
    };
    pc.onicecandidate = event => {
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
      this._addDataChannel('dataChannel');
      this._callbacks.open({ authzMetadata: this.authzMetadata });
    } else {
      this._pc = pc;
    }
  }

  async _addDataChannel(channelId: string, options: Object = undefined) {
    return new Promise((resolve, reject) => {
      if (!this._pc) return reject('PeerConnection Does Not Ready');
      if (this._isOffer) return reject('PeerConnection Has Local Offer');
      let dataChannel = this._findDataChannel(channelId);
      if (dataChannel) {
        return reject('DataChannel Already Exists!');
      }
      dataChannel = this._pc.createDataChannel(channelId, options);
      dataChannel.onclose = (event: Object) => {
        this._traceLog('datachannel onclosed=>', event);
        this._dataChannels = this._dataChannels.filter(dataChannel => dataChannel.label != channelId);
      };
      dataChannel.onerror = (event: Object) => {
        this._traceLog('datachannel onerror=>', event);
        this._dataChannels = this._dataChannels.filter(dataChannel => dataChannel.label != channelId);
      };
      dataChannel.onmessage = (event: Object) => {
        this._traceLog('datachannel onmessage=>', event.data);
        event.channelId = channelId;
        this._callbacks.data(event);
      };
      dataChannel.onopen = (event: Object) => {
        this._traceLog('datachannel onopen=>', event);
      };
      this._dataChannels.push(dataChannel);
      return resolve();
    });
  }

  _onDataChannel(event: Object) {
    this._traceLog('on data channel', event);
    if (!this._pc) return;
    let dataChannel = event.channel;
    let channelId = event.channel.label;
    if (!event.channel) return;
    if (!channelId || channelId.length < 1) return;
    dataChannel.onopen = async (event: Object) => {
      this._traceLog('datachannel onopen=>', event);
    };
    dataChannel.onclose = async (event: Object) => {
      this._traceLog('datachannel onclosed=>', event);
    };
    dataChannel.onerror = async (event: Object) => {
      this._traceLog('datachannel onerror=>', event);
    };
    dataChannel.onmessage = (event: Object) => {
      this._traceLog('datachannel onmessage=>', event.data);
      event.channelId = channelId;
      this._callbacks.data(event);
    };
    if (!this._findDataChannel(channelId)) {
      this._dataChannels.push(event.channel);
    } else {
      this._dataChannels = this._dataChannels.map(channel => {
        if (channel.label == channelId) {
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
    let offer = await this._pc.createOffer({
      offerToReceiveAudio: this.options.audio.enabled && this.options.audio.direction !== 'sendonly',
      offerToReceiveVideo: this.options.video.enabled && this.options.video.direction !== 'sendonly'
    });
    if (this._removeCodec && this.options.video.codec) {
      const codecs = ['VP8', 'VP9', 'H264'];
      codecs.forEach(codec => {
        if (this.options.video.codec !== codec) {
          offer.sdp = removeCodec(offer.sdp, codec);
        }
      });
    }
    this._traceLog('create offer sdp, sdp=', offer.sdp);
    await this._pc.setLocalDescription(offer);
    this._sendSdp(this._pc.localDescription);
    this._isOffer = true;
  }

  _isVideoCodecSpecified() {
    return this.options.video.enabled && this.options.video.codec !== null;
  }

  async _createAnswer() {
    if (!this._pc) {
      return;
    }
    try {
      let answer = await this._pc.createAnswer();
      this._traceLog('create answer sdp, sdp=', answer.sdp);
      await this._pc.setLocalDescription(answer);
      this._sendSdp(this._pc.localDescription);
    } catch (error) {
      await this._disconnect();
      this._callbacks.disconnect({ reason: 'CREATE-ANSWER-ERROR', error: error });
    }
  }

  async _setAnswer(sessionDescription: window.RTCSessionDescription) {
    await this._pc.setRemoteDescription(sessionDescription);
    this._traceLog('set answer sdp=', sessionDescription.sdp);
  }

  async _setOffer(sessionDescription: window.RTCSessionDescription) {
    this._createPeerConnection();
    try {
      await this._pc.setRemoteDescription(sessionDescription);
      this._traceLog('set offer sdp=', sessionDescription.sdp);
      await this._createAnswer();
    } catch (error) {
      await this._disconnect();
      this._callbacks.disconnect({ reason: 'SET-OFFER-ERROR', error: error });
    }
  }

  async _addIceCandidate(candidate: window.RTCIceCandidate) {
    try {
      if (this._pc) {
        await this._pc.addIceCandidate(candidate);
      }
    } catch (_error) {
      this._traceLog('invalid ice candidate', candidate);
    }
  }

  _sendIceCandidate(candidate: window.RTCIceCandidate) {
    const message = { type: 'candidate', ice: candidate };
    this._sendWs(message);
  }

  _sendSdp(sessionDescription: Object) {
    this._sendWs(sessionDescription);
  }

  _sendWs(message: Object) {
    if (this._ws) {
      this._ws.send(JSON.stringify(message));
    }
  }

  _getTransceiver(pc: window.RTCPeerConnection, track: any) {
    let transceiver = null;
    pc.getTransceivers().forEach(t => {
      if (t.sender == track || t.receiver == track) transceiver = t;
    });
    if (!transceiver) {
      throw new Error('invalid transceiver');
    }
    return transceiver;
  }

  _findDataChannel(channelId: string) {
    return this._dataChannels.find(channel => channel.label == channelId);
  }

  async _closeDataChannel(dataChannel: window.RTCDataChannel) {
    return new Promise((resolve, reject) => {
      if (!dataChannel) return resolve();
      if (dataChannel.readyState === 'closed') return resolve();
      dataChannel.onclose = null;
      const timerId = setInterval(() => {
        if (!dataChannel) {
          clearInterval(timerId);
          return reject('DataChannel Closing Error');
        }
        if (dataChannel.readyState === 'closed') {
          clearInterval(timerId);
          return resolve();
        }
      }, 800);
      dataChannel && dataChannel.close();
    });
  }

  async _closePeerConnection() {
    return new Promise((resolve, reject) => {
      if (browser() === 'safari' && this._pc) {
        this._pc.oniceconnectionstatechange = null;
        this._pc.close();
        this._pc = null;
        return resolve();
      }
      if (!this._pc) return resolve();
      if (this._pc && this._pc.signalingState == 'closed') {
        return resolve();
      }
      this._pc.oniceconnectionstatechange = null;
      const timerId = setInterval(() => {
        if (!this._pc) {
          clearInterval(timerId);
          return reject('PeerConnection Closing Error');
        }
        if (this._pc && this._pc.signalingState == 'closed') {
          clearInterval(timerId);
          return resolve();
        }
      }, 800);
      this._pc.close();
    });
  }

  async _closeWebSocketConnection() {
    return new Promise((resolve, reject) => {
      if (!this._ws) return resolve();
      if (this._ws && this._ws.readyState === 3) return resolve();
      this._ws.onclose = () => {};
      const timerId = setInterval(() => {
        if (!this._ws) {
          clearInterval(timerId);
          return reject('WebSocket Closing Error');
        }
        if (this._ws.readyState === 3) {
          clearInterval(timerId);
          return resolve();
        }
      }, 800);
      this._ws && this._ws.close();
    });
  }

  _traceLog(title: string, message: Object | string) {
    if (!this.debug) return;
    traceLog(title, message);
  }
}

export default ConnectionBase;
