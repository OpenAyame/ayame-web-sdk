/* @flow */

/**
 * オーディオ、ビデオの送受信方向に関するオプションです。
 * - sendrecv
 * - recvonly
 * - sendonly
 * @typedef {string} ConnectionDirection
 */
export type ConnectionDirection = 'sendrecv' | 'recvonly' | 'sendonly';

/*
 * オーディオ接続に関するオプションです。
 * @typedef {Object} ConnectionAudioOption
 */
export type ConnectionAudioOption = {
  direction: ConnectionDirection,
  enabled: boolean
};

/*
 * ビデオ接続のコーデックに関するオプションです。
 * - VP8
 * - VP9
 * - H264
 * @typedef {string} ConnectionDirection
 * @typedef {string} VideoCodecOption
 */
export type VideoCodecOption = 'VP8' | 'VP9' | 'H264';

/*
 * ビデオ接続に関するオプションです。
 * @typedef {Object} ConnectionVideoOption
 */
export type ConnectionVideoOption = {
  codec: ?VideoCodecOption,
  direction: ConnectionDirection,
  enabled: boolean
};

/*
  接続時に指定するオプションです。
 * @typedef {Object} ConnectionOptions
 */
export type ConnectionOptions = {
  audio: ConnectionAudioOption,
  video: ConnectionVideoOption,
  clientId: string,
  iceServers: Array<Object>
};
