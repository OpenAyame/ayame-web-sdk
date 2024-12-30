import type { ConnectionOptions, Direction, MetadataOption } from './types'
import { browser, getSelectedCodecs, traceLog } from './utils'

interface AyameRegisterMessage {
  type: string
  roomId: string
  clientId: string
  key?: string
  authnMetadata?: any
  standalone?: boolean
}

class Connection {
  private debug: boolean
  private roomId: string
  private signalingUrl: string
  private options: ConnectionOptions
  private connectionState: string
  private stream: MediaStream | null
  private remoteStream: MediaStream | null
  private authnMetadata: any
  private authzMetadata: any
  private ws: WebSocket | null
  private pc: RTCPeerConnection | null
  private callbacks: any
  private isOffer: boolean
  private isExistUser: boolean
  private dataChannels: RTCDataChannel[]
  private pcConfig: {
    iceServers: RTCIceServer[]
    iceTransportPolicy: RTCIceTransportPolicy
  }

  get webSocket(): WebSocket | null {
    return this.ws
  }

  get peerConnection(): RTCPeerConnection | null {
    return this.pc
  }

  // biome-ignore lint/complexity/noBannedTypes: <explanation>
  on(kind: string, callback: Function): void {
    if (kind in this.callbacks) {
      this.callbacks[kind] = callback
    }
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
    this.dataChannels = []
    this.isOffer = false
    this.isExistUser = false
    this.connectionState = 'new'
    this.pcConfig = {
      iceServers: this.options.iceServers,
      iceTransportPolicy: isRelay ? 'relay' : 'all',
    }
    this.callbacks = {
      open: () => {},
      connect: () => {},
      disconnect: () => {},
      addstream: () => {},
      removestream: () => {},
      bye: () => {},
      datachannel: () => {},
    }
  }

  /**
   * 接続する
   */
  public async connect(
    stream: MediaStream | null,
    metadataOption: MetadataOption | null = null,
  ): Promise<void> {
    if (this.ws) {
      this.traceLog('WebSocket Already Exists!')
      throw new Error('WebSocket Already Exists!')
    }

    if (this.pc) {
      this.traceLog('RTCPeerConnection already exists')
      throw new Error('RTCPeerConnection Already Exists!')
    }

    this.stream = stream
    if (metadataOption) {
      this.authnMetadata = metadataOption.authnMetadata
    }
    await this.signaling()
  }

  /**
   * 接続を切断する
   */
  public async disconnect(): Promise<void> {
    // DataChannel を閉じる
    for (const dataChannel of this.dataChannels) {
      await this.closeDataChannel(dataChannel)
    }
    // WebSocket と PeerConnection を閉じる
    await Promise.all([this.closePeerConnection(), this.closeWebSocketConnection()])

    // 状態の初期化
    this.authzMetadata = null
    this.isOffer = false
    this.isExistUser = false
    this.dataChannels = []
    this.connectionState = 'new'
  }

  /**
   * 統計情報を取得する
   */
  public async getStats(): Promise<RTCStatsReport> {
    if (!this.pc) {
      throw new Error('PeerConnection is not ready')
    }
    return await this.pc.getStats()
  }

  private async signaling(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (this.ws) {
        return reject('WS-ALREADY-EXISTS')
      }
      this.ws = new WebSocket(this.signalingUrl)
      this.ws.onclose = async () => {
        if (!this.options.standalone) {
          await this.disconnect()
          this.callbacks.disconnect({ reason: 'WS-CLOSED' })
          return reject('WS-CLOSED')
        }
      }
      this.ws.onerror = async () => {
        await this.disconnect()
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
        this.sendWs(registerMessage)
        if (this.ws) {
          this.ws.onmessage = async (event: MessageEvent) => {
            try {
              if (typeof event.data !== 'string') {
                return
              }
              const message = JSON.parse(event.data)
              if (message.type === 'ping') {
                this.sendWs({ type: 'pong' })
              } else if (message.type === 'bye') {
                this.callbacks.bye(event)
                return resolve()
              } else if (message.type === 'accept') {
                this.authzMetadata = message.authzMetadata
                if (Array.isArray(message.iceServers) && message.iceServers.length > 0) {
                  this.traceLog('iceServers=>', message.iceServers)
                  this.pcConfig.iceServers = message.iceServers
                }
                this.traceLog('isExistUser=>', message.isExistUser)
                this.isExistUser = message.isExistUser
                this.createPeerConnection()
                if (this.isExistUser === true) {
                  await this.sendOffer()
                }
                return resolve()
              } else if (message.type === 'reject') {
                await this.disconnect()
                this.callbacks.disconnect({ reason: message.reason || 'REJECTED' })
                return reject('REJECTED')
              } else if (message.type === 'offer') {
                if (this.pc && this.pc.signalingState === 'have-local-offer') {
                  this.createPeerConnection()
                }
                this.setOffer(new RTCSessionDescription(message))
              } else if (message.type === 'answer') {
                await this.setAnswer(new RTCSessionDescription(message))
              } else if (message.type === 'candidate') {
                if (message.ice) {
                  this.traceLog('Received ICE candidate ...', message.ice)
                  const candidate = new RTCIceCandidate(message.ice)
                  this.addIceCandidate(candidate)
                }
              }
            } catch (error) {
              await this.disconnect()
              this.callbacks.disconnect({ reason: 'SIGNALING-ERROR', error: error })
            }
          }
        }
      }
    })
  }

  public async removeDataChannel(label: string): Promise<void> {
    const dataChannel = this.findDataChannel(label)
    if (dataChannel && dataChannel.readyState === 'open') {
      await this.closeDataChannel(dataChannel)
    } else {
      throw new Error('data channel is not exist or open')
    }
  }

  private setCodecPreferences(
    videoCapabilities: RTCRtpCapabilities,
    transceiver: RTCRtpTransceiver,
  ): void {
    if (typeof transceiver.setCodecPreferences !== 'undefined') {
      return
    }
    let videoCodecs: RTCRtpCodecCapability[] = []
    if (this.options.video.codecMimeType) {
      videoCodecs = getSelectedCodecs(this.options.video.codecMimeType, videoCapabilities.codecs)
    }
    this.traceLog('video codecs=', videoCodecs)
    transceiver.setCodecPreferences(videoCodecs)
  }

  private createPeerConnection(): void {
    this.traceLog('RTCConfiguration=>', this.pcConfig)

    const pc = new RTCPeerConnection(this.pcConfig)

    const audioTrack = this.stream?.getAudioTracks()[0]
    if (audioTrack && this.options.audio.direction !== 'recvonly' && this.stream) {
      pc.addTrack(audioTrack, this.stream)
    } else if (this.options.audio.enabled) {
      pc.addTransceiver('audio', { direction: 'recvonly' })
    }

    // sendrecv / recvonly が指定されている場合は setCodecPreferences を試みる
    if (this.stream && this.options.video.direction !== 'recvonly') {
      // そもそも videoTracks が 0 じゃないかどうか確認する
      const videoTracks = this.stream.getVideoTracks()
      if (videoTracks.length > 0) {
        const videoTrack = videoTracks[0]
        const videoSender = pc.addTrack(videoTrack, this.stream)
        const videoTransceiver = this.getTransceiver(pc, videoSender)
        // videoCodecMimeType が指定されている場合は映像コーデックの設定を試みる
        if (this.isVideoCodecSpecified() && videoTransceiver !== null) {
          const videoCapabilities = RTCRtpSender.getCapabilities('video')
          if (videoCapabilities) {
            this.setCodecPreferences(videoCapabilities, videoTransceiver)
          }
        }
      }
      // 基本的に受信側はコーデック指定はしないほうがいい
      // recvonly で video が有効な場合、
      // コーデックが指定されていた場合は setCodecPreferences を試みる
    } else if (this.options.video.enabled) {
      const videoTransceiver = pc.addTransceiver('video', { direction: 'recvonly' })
      // videoCodecMimeType が指定されている場合は映像コーデックの設定を試みる
      if (this.isVideoCodecSpecified()) {
        // コーデックを指定された場合は受信出来るかどうかの確認をする
        const videoCapabilities = RTCRtpReceiver.getCapabilities('video')
        if (videoCapabilities) {
          this.setCodecPreferences(videoCapabilities, videoTransceiver)
        }
      }
    }
    const tracks: MediaStreamTrack[] = []
    pc.ontrack = (event: RTCTrackEvent) => {
      const callbackEvent: any = event
      this.traceLog('peer.ontrack()', event)
      if (browser() === 'safari') {
        tracks.push(event.track)
        const mediaStream = new MediaStream(tracks)
        this.remoteStream = mediaStream
      } else {
        this.remoteStream = event.streams[0]
      }
      callbackEvent.stream = this.remoteStream
      this.callbacks.addstream(callbackEvent)
    }
    pc.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
      this.traceLog('peer.onicecandidate()', event)
      if (event.candidate) {
        this.sendIceCandidate(event.candidate)
      } else {
        this.traceLog('empty ice event', '')
      }
    }
    pc.oniceconnectionstatechange = async () => {
      this.traceLog('ICE connection Status has changed to ', pc.iceConnectionState)
      if (this.connectionState !== pc.iceConnectionState) {
        this.connectionState = pc.iceConnectionState
        switch (this.connectionState) {
          case 'connected':
            this.isOffer = false
            this.callbacks.connect()
            break
          case 'disconnected':
          case 'failed':
            await this.disconnect()
            this.callbacks.disconnect({ reason: 'ICE-CONNECTION-STATE-FAILED' })
            break
        }
      }
    }
    pc.onconnectionstatechange = (_) => {
      if (pc.connectionState === 'connected') {
        if (this.options.standalone) {
          this.sendWs({ type: 'connected' })
          if (this.ws) {
            this.traceLog('websocket is closed')
            this.ws.close()
          }
        }
      }
    }
    pc.onsignalingstatechange = (_) => {
      this.traceLog('signaling state changes:', pc.signalingState)
    }
    pc.ondatachannel = this.onDataChannel.bind(this)
    if (!this.pc) {
      this.pc = pc
      this.callbacks.open({ authzMetadata: this.authzMetadata })
    } else {
      this.pc = pc
    }
  }

  public async createDataChannel(
    label: string,
    options: RTCDataChannelInit | undefined,
  ): Promise<RTCDataChannel | null> {
    return new Promise<RTCDataChannel | null>((resolve, reject) => {
      if (!this.pc) return reject('PeerConnection Does Not Ready')
      if (this.isOffer) return reject('PeerConnection Has Local Offer')
      let dataChannel = this.findDataChannel(label)
      if (dataChannel) {
        return reject('DataChannel Already Exists!')
      }
      if (this.isExistUser) {
        dataChannel = this.pc.createDataChannel(label, options)
        dataChannel.onclose = (event: Record<string, any>) => {
          this.traceLog('datachannel onclosed=>', event)
          this.dataChannels = this.dataChannels.filter((dataChannel) => dataChannel.label !== label)
        }
        dataChannel.onerror = (event: Record<string, any>) => {
          this.traceLog('datachannel onerror=>', event)
          this.dataChannels = this.dataChannels.filter((dataChannel) => dataChannel.label !== label)
        }
        dataChannel.onmessage = (event: any) => {
          this.traceLog('datachannel onmessage=>', event.data)
          event.label = label
        }
        dataChannel.onopen = (event: Record<string, any>) => {
          this.traceLog('datachannel onopen=>', event)
        }
        this.dataChannels.push(dataChannel)
        return resolve(dataChannel)
      }
      return resolve(null)
    })
  }

  private onDataChannel(event: RTCDataChannelEvent): void {
    this.traceLog('on data channel', event)
    if (!this.pc) return
    const dataChannel = event.channel
    const label = event.channel.label
    if (!event.channel) return
    if (!label || label.length < 1) return
    dataChannel.onopen = async (event: Record<string, any>) => {
      this.traceLog('datachannel onopen=>', event)
    }
    dataChannel.onclose = async (event: Record<string, any>) => {
      this.traceLog('datachannel onclosed=>', event)
    }
    dataChannel.onerror = async (event: Record<string, any>) => {
      this.traceLog('datachannel onerror=>', event)
    }
    dataChannel.onmessage = (event: any) => {
      this.traceLog('datachannel onmessage=>', event.data)
      event.label = label
    }
    if (!this.findDataChannel(label)) {
      this.dataChannels.push(event.channel)
    } else {
      this.dataChannels = this.dataChannels.map((channel) => {
        if (channel.label === label) {
          return dataChannel
        }
        return channel
      })
    }
    this.callbacks.datachannel(dataChannel)
  }

  private async sendOffer(): Promise<void> {
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
    this.traceLog('create offer sdp, sdp=', offer.sdp)
    await this.pc.setLocalDescription(offer)
    if (this.pc.localDescription) {
      this.sendSdp(this.pc.localDescription)
    }
    this.isOffer = true
  }

  private isVideoCodecSpecified(): boolean {
    return this.options.video.enabled && this.options.video.codecMimeType !== undefined
  }

  private async createAnswer(): Promise<void> {
    if (!this.pc) {
      return
    }
    try {
      const answer = await this.pc.createAnswer()
      this.traceLog('create answer sdp, sdp=', answer.sdp)
      await this.pc.setLocalDescription(answer)
      if (this.pc.localDescription) this.sendSdp(this.pc.localDescription)
    } catch (error) {
      await this.disconnect()
      this.callbacks.disconnect({ reason: 'CREATE-ANSWER-ERROR', error: error })
    }
  }

  private async setAnswer(sessionDescription: RTCSessionDescription): Promise<void> {
    if (!this.pc) {
      return
    }
    await this.pc.setRemoteDescription(sessionDescription)
    this.traceLog('set answer sdp=', sessionDescription.sdp)
  }

  private async setOffer(sessionDescription: RTCSessionDescription): Promise<void> {
    try {
      if (!this.pc) {
        return
      }
      await this.pc.setRemoteDescription(sessionDescription)
      this.traceLog('set offer sdp=', sessionDescription.sdp)
      await this.createAnswer()
    } catch (error) {
      await this.disconnect()
      this.callbacks.disconnect({ reason: 'SET-OFFER-ERROR', error: error })
    }
  }

  private async addIceCandidate(candidate: RTCIceCandidate): Promise<void> {
    try {
      if (this.pc) {
        await this.pc.addIceCandidate(candidate)
      }
    } catch (_error) {
      this.traceLog('invalid ice candidate', candidate)
    }
  }

  private sendIceCandidate(candidate: RTCIceCandidate): void {
    const message = { type: 'candidate', ice: candidate }
    this.sendWs(message)
  }

  private sendSdp(sessionDescription: RTCSessionDescription): void {
    this.sendWs(sessionDescription)
  }

  private sendWs(message: Record<string, any>) {
    if (this.ws) {
      this.ws.send(JSON.stringify(message))
    }
  }

  private getTransceiver(pc: RTCPeerConnection, track: any): RTCRtpTransceiver | null {
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

  private findDataChannel(label: string): RTCDataChannel | undefined {
    return this.dataChannels.find((channel) => channel.label === label)
  }

  private async closeDataChannel(dataChannel: RTCDataChannel): Promise<void> {
    this.traceLog('close data channel')
    return new Promise((resolve) => {
      if (!dataChannel) {
        this.traceLog('data channel is null')
        return resolve()
      }
      if (dataChannel.readyState === 'closed') {
        this.traceLog('data channel is closed')
        return resolve()
      }
      dataChannel.onclose = null
      const timerId = setInterval(() => {
        if (dataChannel.readyState === 'closed') {
          clearInterval(timerId)
          this.traceLog('data channel is closed')
          return resolve()
        }
      }, 200)
      dataChannel.close()
    })
  }

  private async closePeerConnection(): Promise<void> {
    this.traceLog('close peer connection')
    return new Promise<void>((resolve) => {
      if (!this.pc) {
        this.traceLog('peer connection is null')
        return resolve()
      }
      if (this.pc.connectionState === 'closed') {
        this.pc = null
        this.traceLog('peer connection is closed')
        return resolve()
      }
      this.pc.oniceconnectionstatechange = null
      const timerId = setInterval(() => {
        if (!this.pc) {
          clearInterval(timerId)
          this.traceLog('peer connection is null')
          return resolve()
        }
        if (this.pc.connectionState === 'closed') {
          this.pc = null
          clearInterval(timerId)
          this.traceLog('peer connection is closed')
          return resolve()
        }
      }, 200)
      this.pc.close()
    })
  }

  private async closeWebSocketConnection(): Promise<void> {
    return new Promise<void>((resolve) => {
      // WS がない場合はすでに閉じられているので resolve
      if (!this.ws) {
        this.traceLog('websocket is null')
        return resolve()
      }
      // WS がすでに閉じられている場合は resolve
      if (this.ws && this.ws.readyState === WebSocket.CLOSED) {
        this.ws = null
        this.traceLog('websocket is closed')
        return resolve()
      }
      // WS の onclose を null 入れる
      this.ws.onclose = null
      // WS が閉じられるまで待つ
      const timerId = setInterval(() => {
        // WS がない場合はすでに閉じられているので resolve
        if (!this.ws) {
          clearInterval(timerId)
          this.traceLog('websocket is null')
          return resolve()
        }
        // WS が閉じられている場合は resolve
        if (this.ws.readyState === WebSocket.CLOSED) {
          this.ws = null
          clearInterval(timerId)
          this.traceLog('websocket is closed')
          return resolve()
        }
      }, 200)
      // WS を閉じる
      this.ws.close()
    })
  }

  private traceLog(title: string, message?: Record<string, any> | string) {
    if (!this.debug) {
      return
    }
    traceLog(title, message)
  }
}

export default Connection

/**
 * Ayame Connection のデフォルトのオプションです。
 */
export const defaultOptions: ConnectionOptions = {
  audio: { direction: 'sendrecv', enabled: true },
  video: { direction: 'sendrecv', enabled: true },
  iceServers: [],
  clientId: crypto.randomUUID(),
}

/**
 * Ayame Connection を生成します。
 * @deprecated この関数は廃止予定です。代わりに createConnection を使用してください。
 */
export function connection(
  signalingUrl: string,
  roomId: string,
  options: ConnectionOptions = defaultOptions,
  debug = false,
  isRelay = false,
): Connection {
  return new Connection(signalingUrl, roomId, options, debug, isRelay)
}

/**
 * Ayame Connection を生成します。
 */
export const createConnection = (
  signalingUrl: string,
  roomId: string,
  options: ConnectionOptions = defaultOptions,
  debug = false,
  isRelay = false,
): Connection => {
  return new Connection(signalingUrl, roomId, options, debug, isRelay)
}

/**
 * Ayame Web SDK のバージョンを出力します。
 */
export function version(): string {
  return process.version
}

export type { Connection, ConnectionOptions, Direction, MetadataOption }
export { getAvailableCodecs } from './utils'
