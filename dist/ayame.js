/* @OpenAyame/ayame-web-sdk@19.07.2-rc0 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = global || self, factory(global.Ayame = {}));
}(this, function (exports) { 'use strict';

  /*       */

  /* @ignore */
  function randomString(strLength) {
    var result = [];
    var charSet = '0123456789';

    while (strLength--) {
      result.push(charSet.charAt(Math.floor(Math.random() * charSet.length)));
    }

    return result.join('');
  }
  /* @ignore */

  function traceLog(title, value) {
    let prefix = '';

    if (window.performance) {
      prefix = '[Ayame ' + (window.performance.now() / 1000).toFixed(3) + ']';
    }

    if (browser() === 'edge') {
      console.log(prefix + ' ' + title + '\n', value);
    } else {
      console.info(prefix + ' ' + title + '\n', value);
    }
  }
  function getVideoCodecsFromString(codec, codecs) {
    let mimeType = '';

    if (codec === 'VP8') {
      mimeType = 'video/VP8';
    } else if (codec === 'VP9') {
      mimeType = 'video/VP9';
    } else if (codec === 'H264') {
      mimeType = 'video/H264';
    } else {
      mimeType = `video/${codec}`;
    }

    const filteredCodecs = codecs.filter(c => c.mimeType == mimeType);

    if (filteredCodecs.length < 1) {
      throw new Error('invalid video codec type');
    }

    return filteredCodecs;
  }
  function removeCodec(orgSdp, codec) {
    const internalFunc = orgSdp => {
      const codecre = new RegExp('(a=rtpmap:(\\d*) ' + codec + '/90000\\r\\n)');
      const rtpmaps = orgSdp.match(codecre);

      if (rtpmaps == null || rtpmaps.length <= 2) {
        return orgSdp;
      }

      const rtpmap = rtpmaps[2];
      let modsdp = orgSdp.replace(codecre, '');
      const rtcpre = new RegExp('(a=rtcp-fb:' + rtpmap + '.*\r\n)', 'g');
      modsdp = modsdp.replace(rtcpre, '');
      const fmtpre = new RegExp('(a=fmtp:' + rtpmap + '.*\r\n)', 'g');
      modsdp = modsdp.replace(fmtpre, '');
      const aptpre = new RegExp('(a=fmtp:(\\d*) apt=' + rtpmap + '\\r\\n)');
      const aptmaps = modsdp.match(aptpre);
      let fmtpmap = '';

      if (aptmaps != null && aptmaps.length >= 3) {
        fmtpmap = aptmaps[2];
        modsdp = modsdp.replace(aptpre, '');
        const rtppre = new RegExp('(a=rtpmap:' + fmtpmap + '.*\r\n)', 'g');
        modsdp = modsdp.replace(rtppre, '');
      }

      let videore = /(m=video.*\r\n)/;
      const videolines = modsdp.match(videore);

      if (videolines != null) {
        //If many m=video are found in SDP, this program doesn't work.
        let videoline = videolines[0].substring(0, videolines[0].length - 2);
        const videoelems = videoline.split(' ');
        let modvideoline = videoelems[0];
        videoelems.forEach((videoelem, index) => {
          if (index === 0) return;

          if (videoelem == rtpmap || videoelem == fmtpmap) {
            return;
          }

          modvideoline += ' ' + videoelem;
        });
        modvideoline += '\r\n';
        modsdp = modsdp.replace(videore, modvideoline);
      }

      return internalFunc(modsdp);
    };

    return internalFunc(orgSdp);
  }
  /* @ignore */

  function browser() {
    const ua = window.navigator.userAgent.toLocaleLowerCase();

    if (ua.indexOf('edge') !== -1) {
      return 'edge';
    } else if (ua.indexOf('chrome') !== -1 && ua.indexOf('edge') === -1) {
      return 'chrome';
    } else if (ua.indexOf('safari') !== -1 && ua.indexOf('chrome') === -1) {
      return 'safari';
    } else if (ua.indexOf('opera') !== -1) {
      return 'opera';
    } else if (ua.indexOf('firefox') !== -1) {
      return 'firefox';
    }

    return;
  }

  /*       */
  /**
   * オーディオ、ビデオの送受信方向に関するオプションです。
   * - sendrecv
   * - recvonly
   * - sendonly
   * @typedef {string} ConnectionDirection
   */

  /*
   * オーディオ接続に関するオプションです。
   * @typedef {Object} ConnectionAudioOption
   */

  /*
   * ビデオ接続のコーデックに関するオプションです。
   * @typedef {string} VideoCodecOption
   */

  /*
   * ビデオ接続に関するオプションです。
   * @typedef {Object} ConnectionVideoOption
   */

  /*
    接続時に指定するオプションです。
   * @typedef {Object} ConnectionOptions
   */

  /*
   * Peer Connection 接続を管理するクラスです。
   */

  class Connection {
    /*
     * @private
     */
    constructor(signalingUrl, roomId, options, debug = false) {
      this.debug = debug;
      this.roomId = roomId;
      this.signalingUrl = signalingUrl;
      this.options = options;
      this._isNegotiating = false;
      this._removeCodec = false;
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


    on(kind, callback) {
      if (kind in this._callbacks) {
        this._callbacks[kind] = callback;
      }
    }

    async connect(stream, authnMetadata = null) {
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
        if (browser() === 'safari' && this._pc) {
          this._pc.oniceconnectionstatechange = () => {};

          this._pc.close();

          this._pc = null;
          return resolve();
        }

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
      this._removeCodec = false;
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
            this._ws.onmessage = async event => {
              try {
                if (typeof event.data !== 'string') {
                  return;
                }

                const message = JSON.parse(event.data);

                if (message.type === 'ping') {
                  this._sendWs({
                    type: 'pong'
                  });
                } else if (message.type === 'close') {
                  this._callbacks.close(event);
                } else if (message.type === 'accept') {
                  if (!this._pc) this._pc = this._createPeerConnection();
                  await this._sendOffer();

                  this._callbacks.connect({
                    authzMetadata: message.authzMetadata
                  });

                  if (this._ws) {
                    this._ws.onclose = async closeEvent => {
                      await this.disconnect();

                      this._callbacks.disconnect({
                        reason: 'WS-CLOSED',
                        event: closeEvent
                      });
                    };
                  }
                } else if (message.type === 'reject') {
                  await this.disconnect();

                  this._callbacks.disconnect({
                    reason: 'REJECTED'
                  });
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

                this._callbacks.disconnect({
                  reason: 'SIGNALING-ERROR',
                  error: error
                });
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

    _createPeerConnection() {
      const pcConfig = {
        iceServers: this.options.iceServers
      };
      const pc = new window.RTCPeerConnection(pcConfig); // Add local stream to pc.

      const audioTrack = this.stream && this.stream.getAudioTracks()[0];

      if (audioTrack && this.options.audio.direction !== 'recvonly') {
        pc.addTrack(audioTrack, this.stream);
      } else if (this.options.audio.enabled) {
        pc.addTransceiver('audio', {
          direction: 'recvonly'
        });
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
        const videoTransceiver = pc.addTransceiver('video', {
          direction: 'recvonly'
        });

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

      let tracks = [];

      pc.ontrack = event => {
        this._traceLog('peer.ontrack()', event);

        tracks.push(event.track);
        let mediaStream = new window.MediaStream(tracks);
        this.remoteStreamId = mediaStream.id;
        event.stream = mediaStream;

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

        switch (pc.iceConnectionState) {
          case 'connected':
            this._isNegotiating = false;
            break;

          case 'failed':
            await this.disconnect();

            this._callbacks.disconnect({
              reason: 'ICE-CONNECTION-STATE-FAILED'
            });

            break;
        }
      };

      pc.onsignalingstatechange = _ => {
        this._traceLog('signaling state changes:', pc.signalingState);
      };

      return pc;
    }

    async _sendOffer() {
      if (!this._pc) {
        return;
      }

      if (browser() === 'safari') {
        if (this.options.video.enabled && this.options.video.direction === 'sendrecv') {
          this._pc.addTransceiver('video', {
            direction: 'recvonly'
          });
        }

        if (this.options.audio.enabled && this.options.audio.direction === 'sendrecv') {
          this._pc.addTransceiver('audio', {
            direction: 'recvonly'
          });
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
        await this.disconnect();

        this._callbacks.disconnect({
          reason: 'CREATE-ANSWER-ERROR',
          error: error
        });
      }
    }

    async _setAnswer(sessionDescription) {
      await this._pc.setRemoteDescription(sessionDescription);

      this._traceLog('set answer sdp=', sessionDescription.sdp);
    }

    async _setOffer(sessionDescription) {
      this._pc = this._createPeerConnection();

      try {
        await this._pc.setRemoteDescription(sessionDescription);

        this._traceLog('set offer sdp=', sessionDescription.sdp);

        await this._createAnswer();
      } catch (error) {
        await this.disconnect();

        this._callbacks.disconnect({
          reason: 'SET-OFFER-ERROR',
          error: error
        });
      }
    }

    async _addIceCandidate(candidate) {
      try {
        if (this._pc) {
          await this._pc.addIceCandidate(candidate);
        }
      } catch (_error) {
        this._traceLog('invalid ice candidate', candidate);
      }
    }

    _sendIceCandidate(candidate) {
      const message = {
        type: 'candidate',
        ice: candidate
      };

      this._sendWs(message);
    }

    _sendSdp(sessionDescription) {
      this._sendWs(sessionDescription);
    }

    _sendWs(message) {
      if (this._ws) {
        this._ws.send(JSON.stringify(message));
      }
    }

    _traceLog(title, message) {
      if (!this.debug) return;
      traceLog(title, message);
    }

    _getTransceiver(pc, track) {
      let transceiver = null;
      pc.getTransceivers().forEach(t => {
        if (t.sender == track || t.receiver == track) transceiver = t;
      });

      if (!transceiver) {
        throw new Error('invalid transceiver');
      }

      return transceiver;
    }

  }

  /*       */
  const defaultOptions = {
    audio: {
      direction: 'sendrecv',
      enabled: true
    },
    video: {
      direction: 'sendrecv',
      enabled: true,
      codec: null
    },
    iceServers: [{
      urls: 'stun:stun.l.google.com:19302'
    }],
    clientId: randomString(17)
  };
  /*
   * Ayame Connection を生成します。
   *
   * @param {String} signalingUrl シグナリングに用いる websocket url
   * @param {ConnectionOptions} options 接続時のオプション
   * @param {debug} boolean デバッグログを出力するかどうかのフラグ
   */

  function connection(signalingUrl, roomId, options = defaultOptions, debug = false) {
    return new Connection(signalingUrl, roomId, options, debug);
  }
  function version() {
    return process.version;
  }

  exports.connection = connection;
  exports.defaultOptions = defaultOptions;
  exports.version = version;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
