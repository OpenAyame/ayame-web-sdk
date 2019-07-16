/* @flow */
import { randomString } from '../utils';

export type ConnectionDirection = 'sendrecv' | 'recvonly' | 'sendonly';

/*
 * オーディオ接続に関するオプションです。
 */
export type ConnectionAudioOption = {
  direction: ConnectionDirection,
  enabled: boolean
};

/*
 * ビデオ接続に関するオプションです。
 */
export type ConnectionVideoOption = {
  direction: ConnectionDirection,
  enabled: boolean
};

/*
  接続時に指定するオプションです。
 */
export type ConnectionOptions = {
  audio: ConnectionAudioOption,
  video: ConnectionVideoOption,
  clientId?: string,
  iceServers: Array<Object>
};

class Connection {
  roomId: string;
  clientId: ?string;
  signalingUrl: string;
  options: ConnectionOptions;
  stream: ?window.MediaStream;
  remoteStreamId: ?string;
  authnMetadata: ?Object;
  _isNegotiating: boolean;
  _ws: WebSocket;
  _pc: window.RTCPeerConnection;
  _callbacks: Object;

  constructor(signalingUrl: string, roomId: string, options: ConnectionOptions) {
    this.roomId = roomId;
    this.signalingUrl = signalingUrl;
    this.options = options;
    if (options.clientId) {
      this.clientId = options.clientId;
    } else {
      this.clientId = randomString(17);
    }
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

  on(kind: string, callback: Function) {
    if (kind in this._callbacks) {
      this._callbacks[kind] = callback;
    }
  }

  async connect(stream: ?window.RTCMediaStream, authnMetadata: ?Object = null) {
    this.stream = stream;
    this.authnMetadata = authnMetadata;
    this._signaling();
    return stream;
  }

  disconnect() {
    this.remoteStreamId = null;
    if (this.stream) {
      this.stream.getTracks().forEach(t => {
        t.stop();
      });
    }
    this.stream = null;
    this._ws.onclose = () => {};
    this._ws.close();
    if (this._pc && this._pc.signalingState !== 'closed') {
      this._pc.close();
    }
    this._pc = null;
    this._isNegotiating = false;
  }

  _signaling() {
    this._ws = new WebSocket(this.signalingUrl);
    this._ws.onopen = () => {
      const registerMessage = {
        type: 'register',
        roomId: this.roomId,
        clientId: this.clientId,
        authnMetadata: undefined
      };
      if (this.authnMetadata !== null) {
        registerMessage.authnMetadata = this.authnMetadata;
      }
      this._sendWs(registerMessage);
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
            this._ws.onclose = closeEvent => {
              this.disconnect();
              this._callbacks.disconnect({ reason: 'WS-CLOSED', event: closeEvent });
            };
          } else if (message.type === 'reject') {
            this.disconnect();
            this._callbacks.disconnect({ reason: 'REJECTED' });
          } else if (message.type === 'offer') {
            this._setOffer(message);
          } else if (message.type === 'answer') {
            await this._setAnswer(message);
          } else if (message.type === 'candidate') {
            if (message.ice) {
              console.debug('Received ICE candidate ...');
              const candidate = new window.RTCIceCandidate(message.ice);
              this._addIceCandidate(candidate);
            }
          }
        } catch (error) {
          this.disconnect();
          this._callbacks.disconnect({ reason: 'SIGNALING-ERROR', error: error });
        }
      };
    };
    this._ws.onclose = async event => {
      this.disconnect();
      this._callbacks.disconnect(event);
    };
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
        console.log('-- peer.ontrack()', event);
        tracks.push(event.track);
        let mediaStream = new window.MediaStream(tracks);
        this.remoteStreamId = mediaStream.id;
        event.stream = mediaStream;
        this._callbacks.addstream(event);
      };
    }
    pc.onicecandidate = event => {
      if (event.candidate) {
        this._sendIceCandidate(event.candidate);
      }
    };
    pc.oniceconnectionstatechange = () => {
      switch (pc.iceConnectionState) {
        case 'closed':
        case 'failed':
        case 'disconnected':
          break;
      }
    };
    pc.onnegotiationneeded = async () => {
      if (this._isNegotiating) {
        return;
      }
      try {
        this._isNegotiating = true;
        if (isOffer) {
          const offer = await pc.createOffer({
            offerToReceiveAudio: this.options.audio.enabled,
            offerToReceiveVideo: this.options.video.enabled
          });
          await pc.setLocalDescription(offer);
          this._sendSdp(pc.localDescription);
          this._isNegotiating = false;
        }
      } catch (error) {
        this.disconnect();
        this._callbacks.disconnect({ reason: 'NEGOTIATION-ERROR', error: error });
      }
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
      this.disconnect();
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
      this.disconnect();
      this._callbacks.disconnect({ reason: 'SET-OFFER-ERROR', error: error });
    }
  }

  _addIceCandidate(candidate: window.RTCIceCandidate) {
    if (this._pc) {
      this._pc.addIceCandidate(candidate);
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
}

export default Connection;
