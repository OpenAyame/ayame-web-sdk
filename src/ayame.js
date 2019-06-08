/* @flow */
import Connection from './connection';
import type { ConnectionOptions } from './connection';

const defaultOptions = {
  audio: true,
  video: true,
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

export function connection(signalingUrl: string, roomId: string, options: ConnectionOptions = defaultOptions) {
  return new Connection(signalingUrl, roomId, options);
}
export function version() {
  return process.version;
}
