import ConnectionBase from './base';
import { ConnectionOptions, MetadataOption } from './options';

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
  constructor(signalingUrl: string, roomId: string, options: ConnectionOptions, debug = false, isRelay = false) {
    super(signalingUrl, roomId, options, debug, isRelay);
  }

  /**
   * PeerConnection  接続を開始します。
   * @param stream ローカルのストリーム
   * @param metadataOption 送信するメタデータとシグナリングキー
   */
  public async connect(stream: MediaStream | null, metadataOption: MetadataOption | null = null): Promise<void> {
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
   * @param channelId dataChannel の Id
   * @param options dataChannel の init オプション
   */
  public async addDataChannel(channelId: string, options: RTCDataChannelInit | undefined = undefined): Promise<void> {
    await this._addDataChannel(channelId, options);
  }

  /**
   * Datachannel を削除します。
   * @param channelId 削除する dataChannel の Id
   */
  public async removeDataChannel(channelId: string): Promise<void> {
    this._traceLog('datachannel remove=>', channelId);
    const dataChannel = this._findDataChannel(channelId);
    if (dataChannel && dataChannel.readyState === 'open') {
      await this._closeDataChannel(dataChannel);
    } else {
      throw new Error('data channel is not exist or open');
    }
  }

  /**
   * Datachannel でデータを送信します。
   * @param params 送信するデータ
   * @param channelId 指定する dataChannel の id
   */
  public sendData(params: any, channelId = 'dataChannel'): void {
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
  public async disconnect(): Promise<void> {
    await this._disconnect();
  }
}

export default Connection;
