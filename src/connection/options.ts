/**
 * オーディオ、ビデオの送受信方向に関するオプションです。
 * - sendrecv
 * - recvonly
 * - sendonly
 */
export type ConnectionDirection = 'sendrecv' | 'recvonly' | 'sendonly';

/**
 * オーディオ接続に関するオプションです。
 * @member direction 送受信方向
 * @member enabled 有効かどうかのフラグ
 */
export interface ConnectionAudioOption {
  direction: ConnectionDirection;
  enabled: boolean;
}

/**
 * ビデオ接続のコーデックに関するオプションです。
 * - VP8
 * - VP9
 * - H264
 */
export type VideoCodecOption = 'VP8' | 'VP9' | 'H264';

/**
 * ビデオ接続に関するオプションです。
 * @member codec コーデックの設定
 * @member direction 送受信方向
 * @member enabled 有効かどうかのフラグ
 */
export interface ConnectionVideoOption {
  codec?: VideoCodecOption;
  direction: ConnectionDirection;
  enabled: boolean;
}

/**
 * 接続時に指定するオプションです。
 * @member video オーディオの設定
 * @member audio ビデオの設定
 * @member clientId ビデオの設定
 * @member iceServers ayame server から iceServers が返って来なかった場合に使われる iceServer の情報
 * @member signalingKey 送信するシグナリンキー
 */
export interface ConnectionOptions {
  audio: ConnectionAudioOption;
  video: ConnectionVideoOption;
  clientId: string;
  iceServers: Array<RTCIceServer>;
  signalingKey?: string;
}

/**
 * 接続時に指定できるメタデータです。
 * @member authnMetadata 送信するメタデータ
 * @member key シグナリングキー
 */
export interface MetadataOption {
  authnMetadata?: any;
  key?: string;
}
