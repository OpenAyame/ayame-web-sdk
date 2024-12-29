import type { ConnectionOptions } from './types'
/* @private */
import { browser, getSelectedCodecs, traceLog } from './utils'

/**
 * @ignore
 */
interface AyameRegisterMessage {
  type: string
  roomId: string
  clientId: string
  key?: string
  authnMetadata?: any
  standalone?: boolean
}

/**
 * @ignore
 */
class ConnectionBase {
  debug: boolean
  roomId: string
  signalingUrl: string
  options: ConnectionOptions
  connectionState: string
  stream: MediaStream | null
  remoteStream: MediaStream | null
  authnMetadata: any
  authzMetadata: any
  protected ws: WebSocket | null
  protected pc: RTCPeerConnection | null
  protected _callbacks: any
  protected _isOffer: boolean
  protected _isExistUser: boolean
  protected _dataChannels: Array<RTCDataChannel>
  protected pcConfig: {
    iceServers: Array<RTCIceServer>
    iceTransportPolicy: RTCIceTransportPolicy
  }

  /**
   * @ignore
   */

  // biome-ignore lint/complexity/noBannedTypes: <explanation>
  on(kind: string, callback: Function): void {
    if (kind in this._callbacks) {
      this._callbacks[kind] = callback
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
  constructor(
    signalingUrl: string,
    roomId: string,
    options: ConnectionOptions,
    debug = false,
    isRelay = false,
  ) {
    this.debug = debug
    this.roomId = roomId
    this.signalingUrl = signalingUrl
    this.options = options
    this.stream = null
    this.remoteStream = null
    this.pc = null
    this.ws = null
    this.authnMetadata = null
    this.authzMetadata = null
    this._dataChannels = []
    this._isOffer = false
    this._isExistUser = false
    this.connectionState = 'new'
    this.pcConfig = {
      iceServers: this.options.iceServers,
      iceTransportPolicy: isRelay ? 'relay' : 'all',
    }
    this._callbacks = {
      open: () => {},
      connect: () => {},
      disconnect: () => {},
      addstream: () => {},
      removestream: () => {},
      bye: () => {},
      datachannel: () => {},
    }
  }

  async _disconnect(): Promise<void> {
    // biome-ignore lint/complexity/noForEach: <explanation>
    this._dataChannels.forEach(async (dataChannel: RTCDataChannel) => {
      await this._closeDataChannel(dataChannel)
    })
    await this._closePeerConnection()
    await this._closeWebSocketConnection()
    this.authzMetadata = null
    this._isOffer = false
    this._isExistUser = false
    this._dataChannels = []
    this.connectionState = 'new'
  }

  protected async signaling(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (this.ws) {
        return reject('WS-ALREADY-EXISTS')
      }
      this.ws = new WebSocket(this.signalingUrl)
      this.ws.onclose = async () => {
        if (!this.options.standalone) {
          await this._disconnect()
          this._callbacks.disconnect({ reason: 'WS-CLOSED' })
          return reject('WS-CLOSED')
        }
      }
      this.ws.onerror = async () => {
        await this._disconnect()
        return reject('WS-CLOSED-WITH-ERROR')
      }
      this.ws.onopen = () => {
        const registerMessage: AyameRegisterMessage = {
          type: 'register',
          roomId: this.roomId,
          clientId: this.options.clientId,
          authnMetadata: undefined,
          key: undefined,
          standalone: this.options.standalone,
        }
        if (this.authnMetadata !== null) {
          registerMessage.authnMetadata = this.authnMetadata
        }
        if (this.options.signalingKey !== null) {
          registerMessage.key = this.options.signalingKey
        }
        this._sendWs(registerMessage)
        if (this.ws) {
          this.ws.onmessage = async (event: MessageEvent) => {
            try {
              if (typeof event.data !== 'string') {
                return
              }
              const message = JSON.parse(event.data)
              if (message.type === 'ping') {
                this._sendWs({ type: 'pong' })
              } else if (message.type === 'bye') {
                this._callbacks.bye(event)
                return resolve()
              } else if (message.type === 'accept') {
                this.authzMetadata = message.authzMetadata
                if (Array.isArray(message.iceServers) && message.iceServers.length > 0) {
                  this._traceLog('iceServers=>', message.iceServers)
                  this.pcConfig.iceServers = message.iceServers
                }
                this._traceLog('isExistUser=>', message.isExistUser)
                this._isExistUser = message.isExistUser
                this._createPeerConnection()
                if (this._isExistUser === true) {
                  await this._sendOffer()
                }
                return resolve()
              } else if (message.type === 'reject') {
                await this._disconnect()
                this._callbacks.disconnect({ reason: message.reason || 'REJECTED' })
                return reject('REJECTED')
              } else if (message.type === 'offer') {
                if (this.pc && this.pc.signalingState === 'have-local-offer') {
                  this._createPeerConnection()
                }
                this._setOffer(new RTCSessionDescription(message))
              } else if (message.type === 'answer') {
                await this._setAnswer(new RTCSessionDescription(message))
              } else if (message.type === 'candidate') {
                if (message.ice) {
                  this._traceLog('Received ICE candidate ...', message.ice)
                  const candidate = new RTCIceCandidate(message.ice)
                  this._addIceCandidate(candidate)
                }
              }
            } catch (error) {
              await this._disconnect()
              this._callbacks.disconnect({ reason: 'SIGNALING-ERROR', error: error })
            }
          }
        }
      }
    })
  }

  _createPeerConnection(): void {
    this._traceLog('RTCConfiguration=>', this.pcConfig)
    const pc = new RTCPeerConnection(this.pcConfig)
    const audioTrack = this.stream?.getAudioTracks()[0]
    if (audioTrack && this.options.audio.direction !== 'recvonly') {
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      pc.addTrack(audioTrack, this.stream!)
    } else if (this.options.audio.enabled) {
      pc.addTransceiver('audio', { direction: 'recvonly' })
    }
    const videoTrack = this.stream?.getVideoTracks()[0]
    if (videoTrack && this.options.video.direction !== 'recvonly') {
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      const videoSender = pc.addTrack(videoTrack, this.stream!)
      const videoTransceiver = this._getTransceiver(pc, videoSender)
      if (this.isVideoCodecSpecified() && videoTransceiver !== null) {
        if (typeof videoTransceiver.setCodecPreferences !== 'undefined') {
          const videoCapabilities = RTCRtpSender.getCapabilities('video')
          if (videoCapabilities) {
            let videoCodecs: RTCRtpCodecCapability[] = []
            if (this.options.video.codecMimeType) {
              videoCodecs = getSelectedCodecs(
                this.options.video.codecMimeType,
                videoCapabilities.codecs,
              )
            }
            this._traceLog('video codecs=', videoCodecs)
            videoTransceiver.setCodecPreferences(videoCodecs)
          }
        }
      }
    } else if (this.options.video.enabled) {
      const videoTransceiver = pc.addTransceiver('video', { direction: 'recvonly' })
      // videoCodec が指定されている場合は映像コーデックの設定を試みる
      if (this.isVideoCodecSpecified()) {
        // setCodecPreferences が利用できるかどうかを確認する
        if (typeof videoTransceiver.setCodecPreferences !== 'undefined') {
          const videoCapabilities = RTCRtpReceiver.getCapabilities('video')
          if (videoCapabilities) {
            let videoCodecs: RTCRtpCodecCapability[] = []
            if (this.options.video.codecMimeType) {
              videoCodecs = getSelectedCodecs(
                this.options.video.codecMimeType,
                videoCapabilities.codecs,
              )
            }
            this._traceLog('video codecs=', videoCodecs)
            videoTransceiver.setCodecPreferences(videoCodecs)
          }
        }
      }
    }
    const tracks: Array<MediaStreamTrack> = []
    pc.ontrack = (event: RTCTrackEvent) => {
      const callbackEvent: any = event
      this._traceLog('peer.ontrack()', event)
      if (browser() === 'safari') {
        tracks.push(event.track)
        const mediaStream = new MediaStream(tracks)
        this.remoteStream = mediaStream
      } else {
        this.remoteStream = event.streams[0]
      }
      callbackEvent.stream = this.remoteStream
      this._callbacks.addstream(callbackEvent)
    }
    pc.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
      this._traceLog('peer.onicecandidate()', event)
      if (event.candidate) {
        this._sendIceCandidate(event.candidate)
      } else {
        this._traceLog('empty ice event', '')
      }
    }
    pc.oniceconnectionstatechange = async () => {
      this._traceLog('ICE connection Status has changed to ', pc.iceConnectionState)
      if (this.connectionState !== pc.iceConnectionState) {
        this.connectionState = pc.iceConnectionState
        switch (this.connectionState) {
          case 'connected':
            this._isOffer = false
            this._callbacks.connect()
            break
          case 'disconnected':
          case 'failed':
            await this._disconnect()
            this._callbacks.disconnect({ reason: 'ICE-CONNECTION-STATE-FAILED' })
            break
        }
      }
    }
    pc.onconnectionstatechange = (_) => {
      if (pc.connectionState === 'connected') {
        if (this.options.standalone) {
          this._sendWs({ type: 'connected' })
        }
      }
    }
    pc.onsignalingstatechange = (_) => {
      this._traceLog('signaling state changes:', pc.signalingState)
    }
    pc.ondatachannel = this._onDataChannel.bind(this)
    if (!this.pc) {
      this.pc = pc
      this._callbacks.open({ authzMetadata: this.authzMetadata })
    } else {
      this.pc = pc
    }
  }

  async _createDataChannel(
    label: string,
    options: RTCDataChannelInit | undefined,
  ): Promise<RTCDataChannel | null> {
    return new Promise<RTCDataChannel | null>((resolve, reject) => {
      if (!this.pc) return reject('PeerConnection Does Not Ready')
      if (this._isOffer) return reject('PeerConnection Has Local Offer')
      let dataChannel = this._findDataChannel(label)
      if (dataChannel) {
        return reject('DataChannel Already Exists!')
      }
      if (this._isExistUser) {
        dataChannel = this.pc.createDataChannel(label, options)
        dataChannel.onclose = (event: Record<string, any>) => {
          this._traceLog('datachannel onclosed=>', event)
          this._dataChannels = this._dataChannels.filter(
            (dataChannel) => dataChannel.label !== label,
          )
        }
        dataChannel.onerror = (event: Record<string, any>) => {
          this._traceLog('datachannel onerror=>', event)
          this._dataChannels = this._dataChannels.filter(
            (dataChannel) => dataChannel.label !== label,
          )
        }
        dataChannel.onmessage = (event: any) => {
          this._traceLog('datachannel onmessage=>', event.data)
          event.label = label
        }
        dataChannel.onopen = (event: Record<string, any>) => {
          this._traceLog('datachannel onopen=>', event)
        }
        this._dataChannels.push(dataChannel)
        return resolve(dataChannel)
      }
      return resolve(null)
    })
  }

  _onDataChannel(event: RTCDataChannelEvent): void {
    this._traceLog('on data channel', event)
    if (!this.pc) return
    const dataChannel = event.channel
    const label = event.channel.label
    if (!event.channel) return
    if (!label || label.length < 1) return
    dataChannel.onopen = async (event: Record<string, any>) => {
      this._traceLog('datachannel onopen=>', event)
    }
    dataChannel.onclose = async (event: Record<string, any>) => {
      this._traceLog('datachannel onclosed=>', event)
    }
    dataChannel.onerror = async (event: Record<string, any>) => {
      this._traceLog('datachannel onerror=>', event)
    }
    dataChannel.onmessage = (event: any) => {
      this._traceLog('datachannel onmessage=>', event.data)
      event.label = label
    }
    if (!this._findDataChannel(label)) {
      this._dataChannels.push(event.channel)
    } else {
      this._dataChannels = this._dataChannels.map((channel) => {
        if (channel.label === label) {
          return dataChannel
        }
        return channel
      })
    }
    this._callbacks.datachannel(dataChannel)
  }

  async _sendOffer() {
    if (!this.pc) {
      return
    }
    if (browser() === 'safari') {
      if (this.options.video.enabled && this.options.video.direction === 'sendrecv') {
        this.pc.addTransceiver('video', { direction: 'recvonly' })
      }
      if (this.options.audio.enabled && this.options.audio.direction === 'sendrecv') {
        this.pc.addTransceiver('audio', { direction: 'recvonly' })
      }
    }
    const offer: any = await this.pc.createOffer({
      offerToReceiveAudio:
        this.options.audio.enabled && this.options.audio.direction !== 'sendonly',
      offerToReceiveVideo:
        this.options.video.enabled && this.options.video.direction !== 'sendonly',
    })
    this._traceLog('create offer sdp, sdp=', offer.sdp)
    await this.pc.setLocalDescription(offer)
    if (this.pc.localDescription) {
      this._sendSdp(this.pc.localDescription)
    }
    this._isOffer = true
  }

  private isVideoCodecSpecified(): boolean {
    return this.options.video.enabled && this.options.video.codecMimeType !== undefined
  }

  async _createAnswer(): Promise<void> {
    if (!this.pc) {
      return
    }
    try {
      const answer = await this.pc.createAnswer()
      this._traceLog('create answer sdp, sdp=', answer.sdp)
      await this.pc.setLocalDescription(answer)
      if (this.pc.localDescription) this._sendSdp(this.pc.localDescription)
    } catch (error) {
      await this._disconnect()
      this._callbacks.disconnect({ reason: 'CREATE-ANSWER-ERROR', error: error })
    }
  }

  async _setAnswer(sessionDescription: RTCSessionDescription): Promise<void> {
    if (!this.pc) {
      return
    }
    await this.pc.setRemoteDescription(sessionDescription)
    this._traceLog('set answer sdp=', sessionDescription.sdp)
  }

  async _setOffer(sessionDescription: RTCSessionDescription): Promise<void> {
    try {
      if (!this.pc) {
        return
      }
      await this.pc.setRemoteDescription(sessionDescription)
      this._traceLog('set offer sdp=', sessionDescription.sdp)
      await this._createAnswer()
    } catch (error) {
      await this._disconnect()
      this._callbacks.disconnect({ reason: 'SET-OFFER-ERROR', error: error })
    }
  }

  async _addIceCandidate(candidate: RTCIceCandidate): Promise<void> {
    try {
      if (this.pc) {
        await this.pc.addIceCandidate(candidate)
      }
    } catch (_error) {
      this._traceLog('invalid ice candidate', candidate)
    }
  }

  _sendIceCandidate(candidate: RTCIceCandidate): void {
    const message = { type: 'candidate', ice: candidate }
    this._sendWs(message)
  }

  _sendSdp(sessionDescription: RTCSessionDescription): void {
    this._sendWs(sessionDescription)
  }

  _sendWs(message: Record<string, any>) {
    if (this.ws) {
      this.ws.send(JSON.stringify(message))
    }
  }

  _getTransceiver(pc: RTCPeerConnection, track: any): RTCRtpTransceiver | null {
    let transceiver = null
    // biome-ignore lint/complexity/noForEach: <explanation>
    pc.getTransceivers().forEach((t: RTCRtpTransceiver) => {
      if (t.sender === track || t.receiver === track) transceiver = t
    })
    if (!transceiver) {
      throw new Error('invalid transceiver')
    }
    return transceiver
  }

  _findDataChannel(label: string): RTCDataChannel | undefined {
    return this._dataChannels.find((channel) => channel.label === label)
  }

  async _closeDataChannel(dataChannel: RTCDataChannel): Promise<void> {
    return new Promise((resolve) => {
      if (dataChannel.readyState === 'closed') return resolve()
      dataChannel.onclose = null
      const timerId = setInterval(() => {
        if (dataChannel.readyState === 'closed') {
          clearInterval(timerId)
          return resolve()
        }
      }, 400)
      dataChannel?.close()
    })
  }

  async _closePeerConnection(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (browser() === 'safari' && this.pc) {
        this.pc.oniceconnectionstatechange = () => {}
        this.pc.close()
        this.pc = null
        return resolve()
      }
      if (!this.pc) return resolve()
      if (this.pc && this.pc.signalingState === 'closed') {
        this.pc = null
        return resolve()
      }
      this.pc.oniceconnectionstatechange = () => {}
      const timerId = setInterval(() => {
        if (!this.pc) {
          clearInterval(timerId)
          return resolve()
        }
        if (this.pc && this.pc.signalingState === 'closed') {
          this.pc = null
          clearInterval(timerId)
          return resolve()
        }
      }, 400)
      this.pc.close()
    })
  }

  async _closeWebSocketConnection(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (!this.ws) return resolve()
      if (this.ws && this.ws.readyState === 3) {
        this.ws = null
        return resolve()
      }
      this.ws.onclose = () => {}
      const timerId = setInterval(() => {
        if (!this.ws) {
          clearInterval(timerId)
          return resolve()
        }
        if (this.ws.readyState === 3) {
          this.ws = null
          clearInterval(timerId)
          return resolve()
        }
      }, 400)
      this.ws?.close()
    })
  }

  _traceLog(title: string, message?: Record<string, any> | string) {
    if (!this.debug) return
    traceLog(title, message)
  }
}

export default ConnectionBase
