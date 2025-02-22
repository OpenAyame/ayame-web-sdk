export type Direction = 'sendrecv' | 'recvonly' | 'sendonly'

/** 音声の設定 */
export interface ConnectionAudioOption {
  /** コーデックの MIME type */
  codecMimeType?: string
  /** 送受信方向 */
  direction: Direction
  /** 有効かどうかのフラグ */
  enabled: boolean
}

/** 映像の設定 */
export interface ConnectionVideoOption {
  /** コーデックの MIME type */
  codecMimeType?: string
  /** 送受信方向 */
  direction: Direction
  /** 有効かどうかのフラグ */
  enabled: boolean
}

/** 接続時に指定するオプション */
export interface ConnectionOptions {
  /** オーディオの設定 */
  audio: ConnectionAudioOption
  /** ビデオの設定 */
  video: ConnectionVideoOption
  /** クライアントID */
  clientId: string
  /** ayame server から iceServers が返って来なかった場合に使われる iceServer の情報 */
  iceServers: RTCIceServer[]
  /** 送信するシグナリングキー */
  signalingKey?: string
  /** standalone モードの場合は true */
  standalone?: boolean
}

/** 接続時に指定できるメタデータ */
export interface MetadataOption {
  /** 送信するメタデータ */
  authnMetadata?: any
}
