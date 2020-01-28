import ConnectionBase from './base';
import { ConnectionOptions, MetadataOption } from './options';

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
  constructor(signalingUrl: string, roomId: string, options: ConnectionOptions, debug = false, isRelay = false) {
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
  public async connect(stream: MediaStream | null, metadataOption: MetadataOption | null = null): Promise<void> {
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
  public async addDataChannel(label: string, options: RTCDataChannelInit | undefined = undefined): Promise<void> {
    await this._addDataChannel(label, options);
  }

  /**
   * @desc Datachannel を削除します。
   * @param {string} label - 削除する dataChannel の label
   */
  public async removeDataChannel(label: string): Promise<void> {
    this._traceLog('datachannel remove=>', label);
    const dataChannel = this._findDataChannel(label);
    if (dataChannel && dataChannel.readyState === 'open') {
      await this._closeDataChannel(dataChannel);
    } else {
      throw new Error('data channel is not exist or open');
    }
  }

  /**
   * @desc Datachannel でデータを送信します。
   * @param {any} params - 送信するデータ
   * @param {string} [label='dataChannel'] - 指定する dataChannel の label
   */
  public sendData(params: any, label = 'dataChannel'): void {
    this._traceLog('datachannel sendData=>', params);
    const dataChannel = this._findDataChannel(label);
    if (dataChannel && dataChannel.readyState === 'open') {
      dataChannel.send(params);
    } else {
      throw new Error('datachannel is not open');
    }
  }

  /**
   * @desc PeerConnection  接続を切断します。
   */
  public async disconnect(): Promise<void> {
    return new Promise(resolve => {
      if (this._ws) {
        this._ws.close();
      }
      return resolve();
    });
  }
}

export default Connection;
