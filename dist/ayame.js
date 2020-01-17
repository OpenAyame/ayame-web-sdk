/* @OpenAyame/ayame-web-sdk@2020.1 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = global || self, factory(global.Ayame = {}));
}(this, (function (exports) { 'use strict';

  /**
   * @ignore
   */
  function randomString(strLength) {
      const result = [];
      const charSet = '0123456789';
      while (strLength--) {
          result.push(charSet.charAt(Math.floor(Math.random() * charSet.length)));
      }
      return result.join('');
  }
  /**
   * @ignore
   */
  function browser() {
      const ua = window.navigator.userAgent.toLocaleLowerCase();
      if (ua.indexOf('edge') !== -1) {
          return 'edge';
      }
      else if (ua.indexOf('chrome') !== -1 && ua.indexOf('edge') === -1) {
          return 'chrome';
      }
      else if (ua.indexOf('safari') !== -1 && ua.indexOf('chrome') === -1) {
          return 'safari';
      }
      else if (ua.indexOf('opera') !== -1) {
          return 'opera';
      }
      else if (ua.indexOf('firefox') !== -1) {
          return 'firefox';
      }
      return 'unknown';
  }
  /**
   * @ignore
   */
  function traceLog(title, value) {
      let prefix = '';
      if (window.performance) {
          prefix = '[Ayame ' + (window.performance.now() / 1000).toFixed(3) + ']';
      }
      if (browser() === 'edge') {
          console.log(prefix + ' ' + title + '\n', value);
      }
      else {
          console.info(prefix + ' ' + title + '\n', value);
      }
  }
  // Stack Overflow より引用: https://stackoverflow.com/a/52760103
  // https://stackoverflow.com/questions/52738290/how-to-remove-video-codecs-in-webrtc-sdp
  /** @private */
  function getVideoCodecsFromString(codec, codecs) {
      let mimeType = '';
      if (codec === 'VP8') {
          mimeType = 'video/VP8';
      }
      else if (codec === 'VP9') {
          mimeType = 'video/VP9';
      }
      else if (codec === 'H264') {
          mimeType = 'video/H264';
      }
      else {
          mimeType = `video/${codec}`;
      }
      const filteredCodecs = codecs.filter(c => c.mimeType == mimeType);
      if (filteredCodecs.length < 1) {
          throw new Error('invalid video codec type');
      }
      return filteredCodecs;
  }
  /**
   * @ignore
   */
  function removeCodec(sdp, codec) {
      function internalFunc(tmpSdp) {
          // eslint-disable-next-line no-useless-escape
          const codecre = new RegExp('(a=rtpmap:(\\d*) ' + codec + '/90000\\r\\n)');
          const rtpmaps = tmpSdp.match(codecre);
          if (rtpmaps == null || rtpmaps.length <= 2) {
              return sdp;
          }
          const rtpmap = rtpmaps[2];
          let modsdp = tmpSdp.replace(codecre, '');
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
          const videore = /(m=video.*\r\n)/;
          const videolines = modsdp.match(videore);
          if (videolines != null) {
              //If many m=video are found in SDP, this program doesn't work.
              const videoline = videolines[0].substring(0, videolines[0].length - 2);
              const videoelems = videoline.split(' ');
              let modvideoline = videoelems[0];
              videoelems.forEach((videoelem, index) => {
                  if (index === 0)
                      return;
                  if (videoelem == rtpmap || videoelem == fmtpmap) {
                      return;
                  }
                  modvideoline += ' ' + videoelem;
              });
              modvideoline += '\r\n';
              modsdp = modsdp.replace(videore, modvideoline);
          }
          return internalFunc(modsdp);
      }
      return internalFunc(sdp);
  }

  /* @private */
  /**
   * @ignore
   */
  class ConnectionBase {
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
      constructor(signalingUrl, roomId, options, debug = false, isRelay = false) {
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
              open: () => { },
              connect: () => { },
              disconnect: () => { },
              addstream: () => { },
              removestream: () => { },
              bye: () => { },
              data: () => { }
          };
      }
      /**
       * @ignore
       */
      on(kind, callback) {
          if (kind in this._callbacks) {
              this._callbacks[kind] = callback;
          }
      }
      async _disconnect() {
          await this._dataChannels.forEach(async (dataChannel) => {
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
                  if (this.options.signalingKey !== null) {
                      registerMessage.key = this.options.signalingKey;
                  }
                  this._sendWs(registerMessage);
                  if (this._ws) {
                      this._ws.onmessage = async (event) => {
                          try {
                              if (typeof event.data !== 'string') {
                                  return;
                              }
                              const message = JSON.parse(event.data);
                              if (message.type === 'ping') {
                                  this._sendWs({ type: 'pong' });
                              }
                              else if (message.type === 'bye') {
                                  this._callbacks.bye(event);
                                  await this._disconnect();
                                  return resolve();
                              }
                              else if (message.type === 'accept') {
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
                                  }
                                  else {
                                      this._traceLog('isExistUser=>', message.isExistUser);
                                      this._isExistUser = message.isExistUser;
                                      this._createPeerConnection();
                                      if (this._isExistUser === true) {
                                          await this._sendOffer();
                                      }
                                  }
                                  return resolve();
                              }
                              else if (message.type === 'reject') {
                                  await this._disconnect();
                                  this._callbacks.disconnect({ reason: message.reason || 'REJECTED' });
                                  return reject('REJECTED');
                              }
                              else if (message.type === 'offer') {
                                  if (this._pc && this._pc.signalingState === 'have-local-offer') {
                                      this._createPeerConnection();
                                  }
                                  this._setOffer(new RTCSessionDescription(message));
                              }
                              else if (message.type === 'answer') {
                                  await this._setAnswer(new RTCSessionDescription(message));
                              }
                              else if (message.type === 'candidate') {
                                  if (message.ice) {
                                      this._traceLog('Received ICE candidate ...', message.ice);
                                      const candidate = new RTCIceCandidate(message.ice);
                                      this._addIceCandidate(candidate);
                                  }
                              }
                          }
                          catch (error) {
                              await this._disconnect();
                              this._callbacks.disconnect({ reason: 'SIGNALING-ERROR', error: error });
                          }
                      };
                  }
              };
          });
      }
      _createPeerConnection() {
          this._traceLog('RTCConfiguration=>', this._pcConfig);
          const pc = new RTCPeerConnection(this._pcConfig);
          const audioTrack = this.stream && this.stream.getAudioTracks()[0];
          if (audioTrack && this.options.audio.direction !== 'recvonly') {
              pc.addTrack(audioTrack, this.stream);
          }
          else if (this.options.audio.enabled) {
              pc.addTransceiver('audio', { direction: 'recvonly' });
          }
          const videoTrack = this.stream && this.stream.getVideoTracks()[0];
          if (videoTrack && this.options.video.direction !== 'recvonly') {
              const videoSender = pc.addTrack(videoTrack, this.stream);
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
                  }
                  else {
                      this._removeCodec = true;
                  }
              }
          }
          else if (this.options.video.enabled) {
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
                  }
                  else {
                      this._removeCodec = true;
                  }
              }
          }
          const tracks = [];
          pc.ontrack = (event) => {
              const callbackEvent = event;
              this._traceLog('peer.ontrack()', event);
              if (browser() === 'safari') {
                  tracks.push(event.track);
                  const mediaStream = new MediaStream(tracks);
                  this.remoteStream = mediaStream;
              }
              else {
                  this.remoteStream = event.streams[0];
              }
              callbackEvent.stream = this.remoteStream;
              this._callbacks.addstream(callbackEvent);
          };
          pc.onicecandidate = (event) => {
              this._traceLog('peer.onicecandidate()', event);
              if (event.candidate) {
                  this._sendIceCandidate(event.candidate);
              }
              else {
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
          }
          else {
              this._pc = pc;
          }
      }
      async _addDataChannel(label, options) {
          return new Promise((resolve, reject) => {
              if (!this._pc)
                  return reject('PeerConnection Does Not Ready');
              if (this._isOffer)
                  return reject('PeerConnection Has Local Offer');
              let dataChannel = this._findDataChannel(label);
              if (dataChannel) {
                  return reject('DataChannel Already Exists!');
              }
              dataChannel = this._pc.createDataChannel(label, options);
              dataChannel.onclose = (event) => {
                  this._traceLog('datachannel onclosed=>', event);
                  this._dataChannels = this._dataChannels.filter(dataChannel => dataChannel.label != label);
              };
              dataChannel.onerror = (event) => {
                  this._traceLog('datachannel onerror=>', event);
                  this._dataChannels = this._dataChannels.filter(dataChannel => dataChannel.label != label);
              };
              dataChannel.onmessage = (event) => {
                  this._traceLog('datachannel onmessage=>', event.data);
                  event.label = label;
                  this._callbacks.data(event);
              };
              dataChannel.onopen = (event) => {
                  this._traceLog('datachannel onopen=>', event);
              };
              this._dataChannels.push(dataChannel);
              return resolve();
          });
      }
      _onDataChannel(event) {
          this._traceLog('on data channel', event);
          if (!this._pc)
              return;
          const dataChannel = event.channel;
          const label = event.channel.label;
          if (!event.channel)
              return;
          if (!label || label.length < 1)
              return;
          dataChannel.onopen = async (event) => {
              this._traceLog('datachannel onopen=>', event);
          };
          dataChannel.onclose = async (event) => {
              this._traceLog('datachannel onclosed=>', event);
          };
          dataChannel.onerror = async (event) => {
              this._traceLog('datachannel onerror=>', event);
          };
          dataChannel.onmessage = (event) => {
              this._traceLog('datachannel onmessage=>', event.data);
              event.label = label;
              this._callbacks.data(event);
          };
          if (!this._findDataChannel(label)) {
              this._dataChannels.push(event.channel);
          }
          else {
              this._dataChannels = this._dataChannels.map(channel => {
                  if (channel.label == label) {
                      return dataChannel;
                  }
                  else {
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
          const offer = await this._pc.createOffer({
              offerToReceiveAudio: this.options.audio.enabled && this.options.audio.direction !== 'sendonly',
              offerToReceiveVideo: this.options.video.enabled && this.options.video.direction !== 'sendonly'
          });
          if (this._removeCodec && this.options.video.codec) {
              const codecs = ['VP8', 'VP9', 'H264'];
              codecs.forEach((codec) => {
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
      _isVideoCodecSpecified() {
          return this.options.video.enabled && this.options.video.codec !== null;
      }
      async _createAnswer() {
          if (!this._pc) {
              return;
          }
          try {
              const answer = await this._pc.createAnswer();
              this._traceLog('create answer sdp, sdp=', answer.sdp);
              await this._pc.setLocalDescription(answer);
              if (this._pc.localDescription)
                  this._sendSdp(this._pc.localDescription);
          }
          catch (error) {
              await this._disconnect();
              this._callbacks.disconnect({ reason: 'CREATE-ANSWER-ERROR', error: error });
          }
      }
      async _setAnswer(sessionDescription) {
          if (!this._pc) {
              return;
          }
          await this._pc.setRemoteDescription(sessionDescription);
          this._traceLog('set answer sdp=', sessionDescription.sdp);
      }
      async _setOffer(sessionDescription) {
          try {
              if (!this._pc) {
                  return;
              }
              await this._pc.setRemoteDescription(sessionDescription);
              this._traceLog('set offer sdp=', sessionDescription.sdp);
              await this._createAnswer();
          }
          catch (error) {
              await this._disconnect();
              this._callbacks.disconnect({ reason: 'SET-OFFER-ERROR', error: error });
          }
      }
      async _addIceCandidate(candidate) {
          try {
              if (this._pc) {
                  await this._pc.addIceCandidate(candidate);
              }
          }
          catch (_error) {
              this._traceLog('invalid ice candidate', candidate);
          }
      }
      _sendIceCandidate(candidate) {
          const message = { type: 'candidate', ice: candidate };
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
      _getTransceiver(pc, track) {
          let transceiver = null;
          pc.getTransceivers().forEach((t) => {
              if (t.sender == track || t.receiver == track)
                  transceiver = t;
          });
          if (!transceiver) {
              throw new Error('invalid transceiver');
          }
          return transceiver;
      }
      _findDataChannel(label) {
          return this._dataChannels.find(channel => channel.label == label);
      }
      async _closeDataChannel(dataChannel) {
          return new Promise(resolve => {
              if (dataChannel.readyState === 'closed')
                  return resolve();
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
      async _closePeerConnection() {
          return new Promise(resolve => {
              if (browser() === 'safari' && this._pc) {
                  this._pc.oniceconnectionstatechange = () => { };
                  this._pc.close();
                  this._pc = null;
                  return resolve();
              }
              if (!this._pc)
                  return resolve();
              if (this._pc && this._pc.signalingState == 'closed') {
                  this._pc = null;
                  return resolve();
              }
              this._pc.oniceconnectionstatechange = () => { };
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
      async _closeWebSocketConnection() {
          return new Promise(resolve => {
              if (!this._ws)
                  return resolve();
              if (this._ws && this._ws.readyState === 3) {
                  this._ws = null;
                  return resolve();
              }
              this._ws.onclose = () => { };
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
      _traceLog(title, message) {
          if (!this.debug)
              return;
          traceLog(title, message);
      }
  }

  /**
   * Peer Connection 接続を管理するクラスです。
   */
  class Connection extends ConnectionBase {
      /**
       * @desc オブジェクトを生成し、リモートのピアまたはサーバーに接続します。
       * @param {string} signalingUrl シグナリングに利用する URL
       * @param {string} roomId Ayame のルームID
       * @param {ConnectionOptions} options Ayame の接続オプション
       * @param {boolean} [debug=false] デバッグログの出力可否
       * @param {boolean} [isRelay=false] iceTransportPolicy を強制的に relay にするか
       * @listens {open} Ayame Server に accept され、PeerConnection が生成されると送信されます。
       * @listens {connect} PeerConnection が接続されると送信されます。
       * @listens {disconnect} PeerConnection が切断されると送信されます。
       * @listens {addstream} リモートのストリームが追加されると送信されます。
       * @listens {removestream} リモートのストリームが削除されると送信されます。
       */
      constructor(signalingUrl, roomId, options, debug = false, isRelay = false) {
          super(signalingUrl, roomId, options, debug, isRelay);
      }
      /**
       * @typedef {Object} MetadataOption - 接続時に指定できるメタデータです。
       * @property {any} authnMetadata 送信するメタデータ
       */
      /**
       * @desc PeerConnection  接続を開始します。
       * @param {MediaStream|null} [stream=null] - ローカルのストリーム
       * @param {MetadataOption|null} [metadataOption=null] - 送信するメタデータ
       */
      async connect(stream, metadataOption = null) {
          if (this._ws || this._pc) {
              this._traceLog('connection already exists');
              throw new Error('Connection Already Exists!');
          }
          /** @type {MediaStream|null} */
          this.stream = stream;
          if (metadataOption) {
              /** @type {any} */
              this.authnMetadata = metadataOption.authnMetadata;
          }
          await this._signaling();
      }
      /**
       * @desc Datachannel を追加します。
       * @param {string} label - dataChannel の label
       * @param {RTCDataChannelInit|undefined} [options=undefined] - dataChannel の init オプション
       */
      async addDataChannel(label, options = undefined) {
          await this._addDataChannel(label, options);
      }
      /**
       * @desc Datachannel を削除します。
       * @param {string} label - 削除する dataChannel の label
       */
      async removeDataChannel(label) {
          this._traceLog('datachannel remove=>', label);
          const dataChannel = this._findDataChannel(label);
          if (dataChannel && dataChannel.readyState === 'open') {
              await this._closeDataChannel(dataChannel);
          }
          else {
              throw new Error('data channel is not exist or open');
          }
      }
      /**
       * @desc Datachannel でデータを送信します。
       * @param {any} params - 送信するデータ
       * @param {string} [label='dataChannel'] - 指定する dataChannel の label
       */
      sendData(params, label = 'dataChannel') {
          this._traceLog('datachannel sendData=>', params);
          const dataChannel = this._findDataChannel(label);
          if (dataChannel && dataChannel.readyState === 'open') {
              dataChannel.send(params);
          }
          else {
              throw new Error('datachannel is not open');
          }
      }
      /**
       * @desc PeerConnection  接続を切断します。
       */
      async disconnect() {
          await this._disconnect();
      }
  }

  /**
   * オーディオ、ビデオの送受信方向に関するオプションです。
   * - sendrecv
   * - recvonly
   * - sendonly
   *
   * @typedef {string} ConnectionDirection
   */
  /**
   * @typedef {Object} ConnectionAudioOption - オーディオ接続に関するオプションです。
   * @property {ConnectionDirection} direction 送受信方向
   * @property {boolean} enabled 有効かどうかのフラグ
   */
  /**
   * ビデオ接続のコーデックに関するオプションです。
   * - VP8
   * - VP9
   * - H264
   *
   * @typedef {string} VideoCodecOption
   */
  /**
   * @typedef {Object} ConnectionVideoOption - ビデオ接続に関するオプションです。
   * @property {VideoCodecOption} codec コーデックの設定
   * @property {ConnectionDirection} direction 送受信方向
   * @property {boolean} enabled 有効かどうかのフラグ
   */
  /**
   * @typedef {Object} ConnectionOptions - 接続時に指定するオプションです。
   * @property {ConnectionAudioOption} audio オーディオの設定
   * @property {ConnectionVideoOption} video ビデオの設定
   * @property {string} clientId クライアントID
   * @property {Array.<RTCIceServer>} iceServers ayame server から iceServers が返って来なかった場合に使われる iceServer の情報
   * @property {string} signalingKey 送信するシグナリングキー
   */
  /**
   * Ayame Connection のデフォルトのオプションです。
   *
   * audio: { direction: 'sendrecv', enabled: true}
   *
   * video: { direction: 'sendrecv', enabled: true}
   *
   * iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
   *
   * clientId: randomString(17)
   *
   * @type {ConnectionOptions} ConnectionOptions
   */
  const defaultOptions = {
      audio: { direction: 'sendrecv', enabled: true },
      video: { direction: 'sendrecv', enabled: true },
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      clientId: randomString(17)
  };
  /**
   * @desc Ayame Connection を生成します。
   * @param {string} signalingUrl シグナリングに用いる websocket url
   * @param {string} roomId 接続する roomId
   * @param {ConnectionOptions} [options=defaultOptions] 接続時のオプション
   * @param {boolean} [debug=false] デバッグログを出力するかどうかのフラグ
   * @param {boolean} [isRelay=false] iceTranspolicy を強制的に relay するかどうかのフラグ(デバッグ用)
   * @return {Connection} 生成された Ayame Connection
   */
  function connection(signalingUrl, roomId, options = defaultOptions, debug = false, isRelay = false) {
      return new Connection(signalingUrl, roomId, options, debug, isRelay);
  }
  /**
   * @desc Ayame Web SDK のバージョンを出力します。
   * @return {string} Ayame Web SDK のバージョン
   */
  function version() {
      return process.version;
  }

  exports.connection = connection;
  exports.defaultOptions = defaultOptions;
  exports.version = version;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
