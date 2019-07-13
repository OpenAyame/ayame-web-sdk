/* @flow */
import { randomString, isUnifiedPlan } from '../utils';

export type ConnectionOptions = {
  audio?: boolean,
  video?: boolean,
  clientId?: string,
  iceServers: Array<Object>
};

class Connection {
  roomId: string;
  clientId: ?string;
  signalingUrl: string;
  options: ConnectionOptions;
  stream: window.MediaStream;
  remoteStreamId: ?string;
  authnMetadata: ?Object;
  _ws: WebSocket;
  _pc: window.RTCPeerConnection;
  _callbacks: Object;
  _hasReceivedSdp: boolean;
  _candidates: Array<window.RTCIceCandidate>;

  constructor(signalingUrl: string, roomId: string, options: ConnectionOptions) {
    this.roomId = roomId;
    this.signalingUrl = signalingUrl;
    this.options = options;
    if (options.clientId) {
      this.clientId = options.clientId;
    } else {
      this.clientId = randomString(17);
    }
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

  async connect(stream: window.RTCMediaStream, authnMetadata: ?Object = null) {
    this.stream = stream;
    this._hasReceivedSdp = false;
    this._candidates = [];
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
    };
    this._ws.onclose = async event => {
      this.disconnect();
      this._callbacks.disconnect(event);
    };
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
          if (!this._pc) this._pc = this._createPeerConnection();
          this._callbacks.connect({ authzMetadata: message.authzMetadata });
          this._ws.onclose = closeEvent => {
            this.disconnect();
            this._callbacks.disconnect({ reason: 'WS-CLOSED', event: closeEvent });
          };
        } else if (message.type === 'reject') {
          this.disconnect();
          this._callbacks.disconnect({ reason: 'REJECTED' });
        } else if (message.type === 'offer') {
          const offer = new window.RTCSessionDescription(message);
          this._setOffer(offer);
        } else if (message.type === 'answer') {
          const answer = new window.RTCSessionDescription(message);
          await this._setAnswer(answer);
        } else if (message.type === 'candidate') {
          if (message.ice) {
            const candidate = new window.RTCIceCandidate(message.ice);
            if (this._hasReceivedSdp) {
              this._addIceCandidate(candidate);
            } else {
              this._candidates.push(candidate);
            }
          }
        }
      } catch (error) {
        this.disconnect();
        this._callbacks.disconnect({ reason: 'SIGNALING-ERROR', error: error });
      }
    };
  }

  _createPeerConnection() {
    const pcConfig = {
      iceServers: this.options.iceServers
    };
    const pc = new window.RTCPeerConnection(pcConfig);
    if ('ontrack' in pc) {
      pc.ontrack = (event: window.RTCTrackEvent) => {
        const stream = event.streams[0];
        if (!stream) return;
        if (stream.id === 'default') return;
        this.remoteStreamId = stream.id;
        event.stream = stream;
        this._callbacks.addstream(event);
      };
    } else {
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
    }
    pc.onicecandidate = (event: window.RTCIceCandidateEvent) => {
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
      try {
        const offer = await pc.createOffer({
          offerToReceiveAudio: this.options.audio,
          offerToReceiveVideo: this.options.video
        });
        await pc.setLocalDescription(offer);
        this._sendSdp(pc.localDescription);
      } catch (error) {
        this.disconnect();
        this._callbacks.disconnect({ reason: 'NEGOTIATION-ERROR', error: error });
      }
    };
    // Add local stream to pc.
    if (this.stream) {
      if (typeof pc.addStream === 'undefined') {
        this.stream.getTracks().forEach(track => {
          pc.addTrack(track, this.stream);
        });
      } else {
        pc.addStream(this.stream);
      }
    }
    if (isUnifiedPlan(pc)) {
      pc.addTransceiver('video', { direction: 'recvonly' });
      pc.addTransceiver('audio', { direction: 'recvonly' });
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
    this._drainCandidate();
  }

  async _setOffer(sessionDescription: window.RTCSessionDescription) {
    this._pc = this._createPeerConnection();
    this._pc.onnegotiationneeded = () => {};
    try {
      await this._pc.setRemoteDescription(sessionDescription);
      await this._createAnswer();
    } catch (error) {
      this.disconnect();
      this._callbacks.disconnect({ reason: 'SET-OFFER-ERROR', error: error });
    }
  }

  _addIceCandidate(candidate: window.RTCIceCandidate) {
    this._pc.addIceCandidate(candidate);
  }

  _drainCandidate() {
    this._hasReceivedSdp = true;
    this._candidates.forEach((candidate: window.RTCIceCandidate) => {
      this._addIceCandidate(candidate);
    });
    this._candidates = [];
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
