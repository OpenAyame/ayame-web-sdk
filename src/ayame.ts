import ConnectionBase from './base'
import type { ConnectionOptions, MetadataOption } from './types'
import { randomString } from './utils'

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

  constructor(
    signalingUrl: string,
    roomId: string,
    options: ConnectionOptions,
    debug = false,
    isRelay = false,
  ) {
    super(signalingUrl, roomId, options, debug, isRelay)
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
  public async connect(
    stream: MediaStream | null,
    metadataOption: MetadataOption | null = null,
  ): Promise<void> {
    if (this.ws || this.pc) {
      this._traceLog('connection already exists')
      throw new Error('Connection Already Exists!')
    }
    /** @type {MediaStream|null} */
    this.stream = stream
    if (metadataOption) {
      /** @type {any} */
      this.authnMetadata = metadataOption.authnMetadata
    }
    await this.signaling()
  }

  /**
   * @desc Datachannel を作成します。
   * @param {string} label - dataChannel の label
   * @param {RTCDataChannelInit|undefined} [options=undefined] - dataChannel の init オプション
   * @return {RTCDataChannel|null} 生成されたデータチャネル
   */
  public async createDataChannel(
    label: string,
    options: RTCDataChannelInit | undefined = undefined,
  ): Promise<RTCDataChannel | null> {
    return await this._createDataChannel(label, options)
  }

  /**
   * @desc Datachannel を削除します。
   * @param {string} label - 削除する dataChannel の label
   */
  public async removeDataChannel(label: string): Promise<void> {
    this._traceLog('datachannel remove=>', label)
    const dataChannel = this._findDataChannel(label)
    if (dataChannel && dataChannel.readyState === 'open') {
      await this._closeDataChannel(dataChannel)
    } else {
      throw new Error('data channel is not exist or open')
    }
  }

  /**
   * @desc PeerConnection  接続を切断します。
   */
  public async disconnect(): Promise<void> {
    if (this.ws) {
      this.ws.close()
    }

    // standalone モードの場合はここで切断する
    if (this.options.standalone) {
      await this.disconnect()
      this.callbacks.disconnect({ reason: 'DISCONNECTED' })
    }
  }
}

export default Connection

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
 * - AV1
 * - H264
 * - H265
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
 * iceServers: []
 *
 * clientId: randomString(17)
 *
 * @type {ConnectionOptions} ConnectionOptions
 */
export const defaultOptions: ConnectionOptions = {
  audio: { direction: 'sendrecv', enabled: true },
  video: { direction: 'sendrecv', enabled: true },
  iceServers: [],
  clientId: randomString(17),
}

/**
 * @desc Ayame Connection を生成します。
 * @param {string} signalingUrl シグナリングに用いる websocket url
 * @param {string} roomId 接続する roomId
 * @param {ConnectionOptions} [options=defaultOptions] 接続時のオプション
 * @param {boolean} [debug=false] デバッグログを出力するかどうかのフラグ
 * @param {boolean} [isRelay=false] iceTranspolicy を強制的に relay するかどうかのフラグ(デバッグ用)
 * @return {Connection} 生成された Ayame Connection
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
 * @desc Ayame Web SDK のバージョンを出力します。
 * @return {string} Ayame Web SDK のバージョン
 */
export function version(): string {
  return process.version
}

export type { Connection, ConnectionOptions }
export { getAvailableVideoCodecs, Direction } from './utils'
