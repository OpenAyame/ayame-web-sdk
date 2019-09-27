import Connection from './connection';
import { ConnectionOptions } from './connection/options';
import { randomString } from './utils';

export const defaultOptions: ConnectionOptions = {
  audio: { direction: 'sendrecv', enabled: true },
  video: { direction: 'sendrecv', enabled: true },
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  clientId: randomString(17)
};

/**
 * Ayame Connection を生成します。
 *
 * @param signalingUrl シグナリングに用いる websocket url
 * @param roomId 接続する roomId
 * @param options 接続時のオプション
 * @param debug デバッグログを出力するかどうかのフラグ
 * @param isRelay iceTranspolicy を強制的に relay するかどうかのフラグ(デバッグ用)
 * @return Connection
 */
export function connection(
  signalingUrl: string,
  roomId: string,
  options: ConnectionOptions = defaultOptions,
  debug = false,
  isRelay = false
): Connection {
  return new Connection(signalingUrl, roomId, options, debug, isRelay);
}

/**
 * Ayame Web SDK のバージョンを出力します。
 * @return string
 */
export function version(): string {
  return process.version;
}
