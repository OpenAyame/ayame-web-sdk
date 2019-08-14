/* @flow */

/**
 * オーディオ、ビデオの送受信方向に関するオプションです。
 * - sendrecv
 * - recvonly
 * - sendonly
 * @typedef {string} ConnectionDirection
 */
export type ConnectionDirection = 'sendrecv' | 'recvonly' | 'sendonly';

/**
 * オーディオ接続に関するオプションです。
 * @typedef {Object} ConnectionAudioOption
 * @property {ConnectionDirection} direction 送受信方向
 * @property {boolean} enabled 有効かどうかのフラグ
 */
export type ConnectionAudioOption = {
  direction: ConnectionDirection,
  enabled: boolean
};

/**
 * ビデオ接続のコーデックに関するオプションです。
 * - VP8
 * - VP9
 * - H264
 * @typedef {string} ConnectionDirection
 * @typedef {string} VideoCodecOption
 */
export type VideoCodecOption = 'VP8' | 'VP9' | 'H264';

/**
 * ビデオ接続に関するオプションです。
 * @typedef {Object} ConnectionVideoOption
 * @property {VideoCodecOption | null} codec コーデックの設定
 * @property {ConnectionDirection} direction 送受信方向
 * @property {boolean} enabled 有効かどうかのフラグ
 */
export type ConnectionVideoOption = {
  codec: ?VideoCodecOption,
  direction: ConnectionDirection,
  enabled: boolean
};

/**
 * 接続時に指定するオプションです。
 * @typedef {Object} ConnectionOptions
 * @property {ConnectionAudioOption} video オーディオの設定
 * @property {ConnectionVideoOption} audio ビデオの設定
 * @property {string} clientId ビデオの設定
 * @property {Array<Object>} iceServers ayame server から iceServers が返って来なかった場合に使われる iceServer の情報
 * @property {string | null} signalingKey 送信するシグナリンキー
 */
export type ConnectionOptions = {
  audio: ConnectionAudioOption,
  video: ConnectionVideoOption,
  clientId: string,
  iceServers: Array<Object>,
  signalingKey: ?string
};

/**
 * 接続時に指定できるメタデータです。
 * @typedef {Object} MetadataOption
 * @property {Object | null} authnMetadata 送信するメタデータ
 */
export type MetadataOption = {
  authnMetadata: ?Object,
  key: ?string
};
