import { ConnectionOptions } from './options';
/**
 * @ignore
 */
declare class ConnectionBase {
    debug: boolean;
    roomId: string;
    signalingUrl: string;
    options: ConnectionOptions;
    connectionState: string;
    stream: MediaStream | null;
    remoteStream: MediaStream | null;
    authnMetadata: any;
    authzMetadata: any;
    _ws: WebSocket | null;
    _pc: RTCPeerConnection | null;
    _callbacks: any;
    _removeCodec: boolean;
    _isOffer: boolean;
    _isExistUser: boolean;
    _dataChannels: Array<RTCDataChannel>;
    _pcConfig: {
        iceServers: Array<RTCIceServer>;
        iceTransportPolicy: RTCIceTransportPolicy;
    };
    /**
     * @ignore
     */
    on(kind: string, callback: Function): void;
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
    constructor(signalingUrl: string, roomId: string, options: ConnectionOptions, debug?: boolean, isRelay?: boolean);
    _disconnect(): Promise<void>;
    _signaling(): Promise<void>;
    _createPeerConnection(): void;
    _createDataChannel(label: string, options: RTCDataChannelInit | undefined): Promise<RTCDataChannel | null>;
    _onDataChannel(event: RTCDataChannelEvent): void;
    _sendOffer(): Promise<void>;
    _isVideoCodecSpecified(): boolean;
    _createAnswer(): Promise<void>;
    _setAnswer(sessionDescription: RTCSessionDescription): Promise<void>;
    _setOffer(sessionDescription: RTCSessionDescription): Promise<void>;
    _addIceCandidate(candidate: RTCIceCandidate): Promise<void>;
    _sendIceCandidate(candidate: RTCIceCandidate): void;
    _sendSdp(sessionDescription: RTCSessionDescription): void;
    _sendWs(message: Record<string, any>): void;
    _getTransceiver(pc: RTCPeerConnection, track: any): RTCRtpTransceiver | null;
    _findDataChannel(label: string): RTCDataChannel | undefined;
    _closeDataChannel(dataChannel: RTCDataChannel): Promise<void>;
    _closePeerConnection(): Promise<void>;
    _closeWebSocketConnection(): Promise<void>;
    _traceLog(title: string, message?: Record<string, any> | string): void;
}
export default ConnectionBase;
