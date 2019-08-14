/* @flow */
import Connection from './connection';
import type { ConnectionOptions } from './connection/options';
/* @access private */
import { randomString } from './utils';

export const defaultOptions: ConnectionOptions = {
  audio: { direction: 'sendrecv', enabled: true },
  video: { direction: 'sendrecv', enabled: true, codec: null },
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  clientId: randomString(17),
  signalingKey: null
};

/**
 * Ayame Connection を生成します。
 *
 * @param {string} signalingUrl シグナリングに用いる websocket url
 * @param {string} roomId 接続する roomId
 * @param {ConnectionOptions} [options=defaultOptions] 接続時のオプション
 * @param {boolean} [debug=false] デバッグログを出力するかどうかのフラグ
 * @return {Connection}
 */
export function connection(
  signalingUrl: string,
  roomId: string,
  options: ConnectionOptions = defaultOptions,
  debug: boolean = false
): Connection {
  return new Connection(signalingUrl, roomId, options, debug);
}

/**
 * Ayame Web SDK のバージョンを出力します。
 * @return {string}
 */
export function version(): string {
  return process.version;
}
