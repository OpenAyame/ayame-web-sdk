/* @flow */
/* @private */
import { traceLog } from '../utils';

/**
 * オーディオ、ビデオの送受信方向に関するオプションです。
 * - sendrecv
 * - recvonly
 * - sendonly
 * @typedef {string} ConnectionDirection
 */
export type ConnectionDirection = 'sendrecv' | 'recvonly' | 'sendonly';

/*
 * オーディオ接続に関するオプションです。
 * @typedef {Object} ConnectionAudioOption
 */
export type ConnectionAudioOption = {
  direction: ConnectionDirection,
  enabled: boolean
};

/*
 * ビデオ接続に関するオプションです。
 * @typedef {Object} ConnectionVideoOption
 */
export type ConnectionVideoOption = {
  direction: ConnectionDirection,
  enabled: boolean
};

/*
  接続時に指定するオプションです。
 * @typedef {Object} ConnectionOptions
 */
export type ConnectionOptions = {
  audio: ConnectionAudioOption,
  video: ConnectionVideoOption,
  clientId: string,
  iceServers: Array<Object>
};

/*
 * Peer Connection 接続を管理するクラスです。
 */
class Connection {
  debug: boolean;
  roomId: string;
  signalingUrl: string;
  options: ConnectionOptions;
  stream: ?window.MediaStream;
  remoteStreamId: ?string;
  authnMetadata: ?Object;
  _isNegotiating: boolean;
  _ws: ?WebSocket;
  _pc: window.RTCPeerConnection;
  _callbacks: Object;

  /*
   * @private
   */
  constructor(signalingUrl: string, roomId: string, options: ConnectionOptions, debug: boolean = false) {
    this.debug = debug;
    this.roomId = roomId;
    this.signalingUrl = signalingUrl;
    this.options = options;
    this._isNegotiating = false;
    this.stream = null;
    this._pc = null;
    this.authnMetadata = null;
    this._callbacks = {
      connect: () => {},
      disconnect: () => {},
      addstream: () => {},
      removestream: () => {}
    };
  }
  /*
   * @private
   */
  on(kind: string, callback: Function) {
    if (kind in this._callbacks) {
      this._callbacks[kind] = callback;
    }
  }

  async connect(stream: ?window.RTCMediaStream, authnMetadata: ?Object = null) {
    if (this._ws || this._pc) {
      this._traceLog('connection already exists');
      throw new Error('Connection Already Exists!');
    }
    this.stream = stream;
    this.authnMetadata = authnMetadata;
    await this._signaling();
    return stream;
  }

  async disconnect() {
    const closePeerConnection = new Promise((resolve, reject) => {
      if (!this._pc) return resolve();
      if (this._pc && this._pc.signalingState == 'closed') {
        return resolve();
      }
      this._pc.oniceconnectionstatechange = () => {};
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
    const closeWebSocketConnection = new Promise((resolve, reject) => {
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
    if (this.stream) {
      this.stream.getTracks().forEach(t => {
        t.stop();
      });
    }
    this.remoteStreamId = null;
    this.stream = null;
    this.authnMetadata = null;
    this._isNegotiating = false;
    await Promise.all([closeWebSocketConnection, closePeerConnection]);
    this._ws = null;
    this._pc = null;
  }

  async _signaling() {
    return new Promise((resolve, reject) => {
      if (this._ws) {
        return reject('WebSocket Connnection Already Exists!');
      }
      this._ws = new WebSocket(this.signalingUrl);
      this._ws.onopen = () => {
        const registerMessage = {
          type: 'register',
          roomId: this.roomId,
          clientId: this.options.clientId,
          authnMetadata: undefined
        };
        if (this.authnMetadata !== null) {
          registerMessage.authnMetadata = this.authnMetadata;
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
                if (!this._pc) this._pc = this._createPeerConnection(true);
                this._callbacks.connect({ authzMetadata: message.authzMetadata });
                if (this._ws) {
                  this._ws.onclose = async closeEvent => {
                    await this.disconnect();
                    this._callbacks.disconnect({ reason: 'WS-CLOSED', event: closeEvent });
                  };
                }
              } else if (message.type === 'reject') {
                await this.disconnect();
                this._callbacks.disconnect({ reason: 'REJECTED' });
              } else if (message.type === 'offer') {
                this._setOffer(message);
              } else if (message.type === 'answer') {
                await this._setAnswer(message);
              } else if (message.type === 'candidate') {
                if (message.ice) {
                  this._traceLog('Received ICE candidate ...', message.ice);
                  const candidate = new window.RTCIceCandidate(message.ice);
                  this._addIceCandidate(candidate);
                }
              }
            } catch (error) {
              await this.disconnect();
              this._callbacks.disconnect({ reason: 'SIGNALING-ERROR', error: error });
            }
          };
        }
      };
      if (this._ws) {
        this._ws.onclose = async event => {
          await this.disconnect();
          this._callbacks.disconnect(event);
        };
      }
      return resolve();
    });
  }

  _createPeerConnection(isOffer: boolean) {
    const pcConfig = {
      iceServers: this.options.iceServers
    };
    const pc = new window.RTCPeerConnection(pcConfig);
    if (typeof pc.ontrack === 'undefined') {
      pc.onaddstream = (event: window.RTCStreamEvent) => {
        const stream = event.stream;
        if ((this.remoteStreamId && stream.id !== this.remoteStreamId) || this.remoteStreamId === null) {
          this.remoteStreamId = stream.id;
          this._callbacks.addstream(event);
        }
      };
      pc.onremovestream = event => {
        if (this.remoteStreamId && event.stream.id === this.remoteStreamId) {
          this.remoteStreamId = null;
          this._callbacks.removestream(event);
        }
      };
    } else {
      let tracks = [];
      pc.ontrack = (event: window.RTCTrackEvent) => {
        this._traceLog('peer.ontrack()', event);
        tracks.push(event.track);
        let mediaStream = new window.MediaStream(tracks);
        this.remoteStreamId = mediaStream.id;
        event.stream = mediaStream;
        this._callbacks.addstream(event);
      };
    }
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
      switch (pc.iceConnectionState) {
        case 'connected':
          this._isNegotiating = false;
          break;
        case 'failed':
          await this.disconnect();
          this._callbacks.disconnect({ reason: 'ICE-CONNECTION-STATE-FAILED' });
          break;
      }
    };
    pc.onnegotiationneeded = async () => {
      this._traceLog('peer.onnegotiationneeded', '');
      if (this._isNegotiating || this._pc.signalingState !== 'stable') {
        return;
      }
      try {
        this._isNegotiating = true;
        if (isOffer) {
          const offer = await pc.createOffer({
            offerToReceiveAudio: this.options.audio.enabled && this.options.audio.direction !== 'sendonly',
            offerToReceiveVideo: this.options.video.enabled && this.options.video.direction !== 'sendonly'
          });
          await pc.setLocalDescription(offer);
          this._sendSdp(pc.localDescription);
          this._isNegotiating = false;
        }
      } catch (error) {
        await this.disconnect();
        this._callbacks.disconnect({ reason: 'NEGOTIATION-ERROR', error: error });
      }
    };
    pc.onsignalingstatechange = _ => {
      this._traceLog('signaling state changes:', pc.signalingState);
    };
    // Add local stream to pc.
    const videoTrack = this.stream && this.stream.getVideoTracks()[0];
    const audioTrack = this.stream && this.stream.getAudioTracks()[0];
    if (audioTrack) {
      pc.addTrack(audioTrack, this.stream);
    }
    pc.addTransceiver('audio', { direction: 'recvonly' });
    if (videoTrack) {
      pc.addTrack(videoTrack, this.stream);
    }
    pc.addTransceiver('video', { direction: 'recvonly' });

    if (this.options.video.direction === 'sendonly') {
      pc.getTransceivers().forEach(transceiver => {
        videoTrack && transceiver.sender.replaceTrack(videoTrack);
        transceiver.direction = this.options.video.direction;
      });
    }
    if (this.options.audio.direction === 'sendonly') {
      pc.getTransceivers().forEach(transceiver => {
        audioTrack && transceiver.sender.replaceTrack(audioTrack);
        transceiver.direction = this.options.audio.direction;
      });
    }
    return pc;
  }

  async _createAnswer() {
    if (!this._pc) {
      return;
    }
    try {
      let answer = await this._pc.createAnswer();
      await this._pc.setLocalDescription(answer);
      this._sendSdp(this._pc.localDescription);
    } catch (error) {
      await this.disconnect();
      this._callbacks.disconnect({ reason: 'CREATE-ANSWER-ERROR', error: error });
    }
  }

  async _setAnswer(sessionDescription: window.RTCSessionDescription) {
    await this._pc.setRemoteDescription(sessionDescription);
  }

  async _setOffer(sessionDescription: window.RTCSessionDescription) {
    this._pc = this._createPeerConnection(false);
    try {
      await this._pc.setRemoteDescription(sessionDescription);
      await this._createAnswer();
    } catch (error) {
      await this.disconnect();
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
  _traceLog(title: string, message: Object | string) {
    if (!this.debug) return;
    traceLog(title, message);
  }
}

export default Connection;
