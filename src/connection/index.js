/* @flow */
import ConnectionBase from './base';
import { type ConnectionOptions, type MetadataOption } from './options';

/**
 * Peer Connection 接続を管理するクラスです。
 */
class Connection extends ConnectionBase {
  /**
   * オブジェクトを生成し、リモートのピアまたはサーバーに接続します。
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
  constructor(signalingUrl: string, roomId: string, options: ConnectionOptions, debug: boolean = false, isRelay: boolean = false) {
    super(signalingUrl, roomId, options, debug, isRelay);
  }

  /**
   * PeerConnection  接続を開始します。
   * @param {RTCMediaStream|null} stream ローカルのストリーム
   * @param {MetadataOption|null} metadataOption 送信するメタデータとシグナリングキー
   * @return {Promise<null>}
   */
  async connect(stream: window.RTCMediaStream | null, metadataOption: ?MetadataOption = null) {
    if (this._ws || this._pc) {
      this._traceLog('connection already exists');
      throw new Error('Connection Already Exists!');
    }
    this.stream = stream;
    if (metadataOption) {
      this.authnMetadata = metadataOption.authnMetadata;
    }
    await this._signaling();
  }

  /**
   * Datachannel を追加します。
   * @param {string} channelId dataChannel の Id
   * @param {Object|null} options dataChannel の init オプション
   * @return {Promise<null>}
   */
  async addDataChannel(channelId: string, options: Object | null = null) {
    await this._addDataChannel(channelId, options);
  }

  /**
   * Datachannel を削除します。
   * @param {string} channelId 削除する dataChannel の Id
   * @return {Promise<null>}
   */
  async removeDataChannel(channelId: string) {
    this._traceLog('datachannel remove=>', channelId);
    const dataChannel = this._findDataChannel(channelId);
    if (dataChannel && dataChannel.readyState === 'open') {
      await this._closeDataChannel(dataChannel);
      return;
    } else {
      throw new Error('data channel is not exist or open');
    }
  }

  /**
   * Datachannel でデータを送信します。
   * @param {any} params 送信するデータ
   * @param {string} channelId 指定する dataChannel の id
   * @return {null}
   */
  sendData(params: any, channelId: string = 'dataChannel') {
    this._traceLog('datachannel sendData=>', params);
    const dataChannel = this._findDataChannel(channelId);
    if (dataChannel && dataChannel.readyState === 'open') {
      dataChannel.send(params);
    } else {
      throw new Error('datachannel is not open');
    }
  }

  /**
   * PeerConnection  接続を切断します。
   * @return {Promise<void>}
   */
  async disconnect() {
    await this._disconnect();
  }
}

export default Connection;
