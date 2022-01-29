import ConnectionBase from './base';
import { ConnectionOptions, MetadataOption } from './options';
/**
 * Peer Connection 接続を管理するクラスです。
 */
declare class Connection extends ConnectionBase {
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
    constructor(signalingUrl: string, roomId: string, options: ConnectionOptions, debug?: boolean, isRelay?: boolean);
    /**
     * @typedef {Object} MetadataOption - 接続時に指定できるメタデータです。
     * @property {any} authnMetadata 送信するメタデータ
     */
    /**
     * @desc PeerConnection  接続を開始します。
     * @param {MediaStream|null} [stream=null] - ローカルのストリーム
     * @param {MetadataOption|null} [metadataOption=null] - 送信するメタデータ
     */
    connect(stream: MediaStream | null, metadataOption?: MetadataOption | null): Promise<void>;
    /**
     * @desc Datachannel を作成します。
     * @param {string} label - dataChannel の label
     * @param {RTCDataChannelInit|undefined} [options=undefined] - dataChannel の init オプション
     * @return {RTCDataChannel|null} 生成されたデータチャネル
     */
    createDataChannel(label: string, options?: RTCDataChannelInit | undefined): Promise<RTCDataChannel | null>;
    /**
     * @desc Datachannel を削除します。
     * @param {string} label - 削除する dataChannel の label
     */
    removeDataChannel(label: string): Promise<void>;
    /**
     * @desc PeerConnection  接続を切断します。
     */
    disconnect(): Promise<void>;
}
export default Connection;
