import { signal, computed } from '@preact/signals'
import type { Connection, Direction } from '@open-ayame/ayame-web-sdk'

// Ayame signals
export const ayameVersion = signal('')
export const ayameConnection = signal<Connection | null>(null)
export const ayameConnectionState = signal<RTCPeerConnectionState>('new')

// Media stream signals
export const localMediaStream = signal<MediaStream | null>(null)
export const remoteMediaStream = signal<MediaStream | null>(null)

// Permission signals
export const microphonePermissionState = signal<PermissionState | undefined>(undefined)
export const cameraPermissionState = signal<PermissionState | undefined>(undefined)

// Media device signals
export const audioInputDeviceId = signal('default')
export const audioOutputDeviceId = signal('default')
export const videoInputDeviceId = signal('default')

// Settings signals
export const audioEnabled = signal(true)
export const audioDirection = signal<Direction>('sendrecv')
export const audioCodecMimeType = signal('undefined')

export const videoEnabled = signal(true)
export const videoDirection = signal<Direction>('sendrecv')
export const videoCodecMimeType = signal('undefined')

export const signalingUrl = signal(import.meta.env.VITE_AYAME_SIGNALING_URL || '')
export const roomId = signal(
  `${import.meta.env.VITE_AYAME_ROOM_ID_PREFIX ?? ''}${import.meta.env.VITE_AYAME_ROOM_NAME ?? ''}` ||
    '',
)
export const clientId = signal(crypto.randomUUID())
export const signalingKey = signal(import.meta.env.VITE_AYAME_SIGNALING_KEY || '')

export const debug = signal(false)
export const standalone = signal(false)

// Helper functions for permission states
export const setMicrophonePermissionState = async () => {
  const permissionStatus = await navigator.permissions.query({
    name: 'microphone' as PermissionName,
  })
  microphonePermissionState.value = permissionStatus.state

  // リアルタイムにパーミッションが変わったときに反映するようにする
  permissionStatus.onchange = () => {
    microphonePermissionState.value = permissionStatus.state
  }
}

export const setCameraPermissionState = async () => {
  const permissionStatus = await navigator.permissions.query({
    name: 'camera' as PermissionName,
  })
  cameraPermissionState.value = permissionStatus.state

  // リアルタイムにパーミッションが変わったときに反映するようにする
  permissionStatus.onchange = () => {
    cameraPermissionState.value = permissionStatus.state
  }
}

// Helper functions for URL params
export const generateUrlParams = () => {
  const params = new URLSearchParams()

  params.set('audio', audioEnabled.value.toString())
  params.set('audioDirection', audioDirection.value)
  params.set('audioCodecMimeType', audioCodecMimeType.value)

  params.set('video', videoEnabled.value.toString())
  params.set('videoDirection', videoDirection.value)
  params.set('videoCodecMimeType', videoCodecMimeType.value)

  params.set('signalingUrl', signalingUrl.value)
  params.set('roomId', roomId.value)
  params.set('signalingKey', signalingKey.value)
  params.set('debug', debug.value.toString())
  params.set('standalone', standalone.value.toString())

  return params.toString()
}

export const setSettingsFromUrl = (params: URLSearchParams) => {
  audioEnabled.value = params.get('audio') !== 'false'
  audioDirection.value = (params.get('audioDirection') as Direction) || 'sendrecv'
  audioCodecMimeType.value = params.get('audioCodecMimeType') || 'undefined'

  videoEnabled.value = params.get('video') !== 'false'
  videoDirection.value = (params.get('videoDirection') as Direction) || 'sendrecv'
  videoCodecMimeType.value = params.get('videoCodecMimeType') || 'undefined'

  // 項目がなかった場合は今ある値をそのまま利用する
  signalingUrl.value = params.get('signalingUrl') || signalingUrl.value
  roomId.value = params.get('roomId') || roomId.value
  clientId.value = params.get('clientId') || clientId.value
  signalingKey.value = params.get('signalingKey') || signalingKey.value
  debug.value = params.get('debug') === 'true'
  standalone.value = params.get('standalone') === 'true'
}
