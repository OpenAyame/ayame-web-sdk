/* @flow */
import Connection from './connection';
import type { ConnectionOptions } from './connection';
import { randomString } from './utils';

export const defaultOptions: ConnectionOptions = {
  audio: { direction: 'sendrecv', enabled: true },
  video: { direction: 'sendrecv', enabled: true },
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  clientId: randomString(17)
};

export function connection(signalingUrl: string, roomId: string, options: ConnectionOptions = defaultOptions) {
  return new Connection(signalingUrl, roomId, options);
}
export function version() {
  return process.version;
}
