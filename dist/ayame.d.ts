import Connection from './connection';
import { ConnectionOptions } from './connection/options';
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
 * - H264
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
 * iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
 *
 * clientId: randomString(17)
 *
 * @type {ConnectionOptions} ConnectionOptions
 */
export declare const defaultOptions: ConnectionOptions;
/**
 * @desc Ayame Connection を生成します。
 * @param {string} signalingUrl シグナリングに用いる websocket url
 * @param {string} roomId 接続する roomId
 * @param {ConnectionOptions} [options=defaultOptions] 接続時のオプション
 * @param {boolean} [debug=false] デバッグログを出力するかどうかのフラグ
 * @param {boolean} [isRelay=false] iceTranspolicy を強制的に relay するかどうかのフラグ(デバッグ用)
 * @return {Connection} 生成された Ayame Connection
 */
export declare function connection(signalingUrl: string, roomId: string, options?: ConnectionOptions, debug?: boolean, isRelay?: boolean): Connection;
/**
 * @desc Ayame Web SDK のバージョンを出力します。
 * @return {string} Ayame Web SDK のバージョン
 */
export declare function version(): string;
