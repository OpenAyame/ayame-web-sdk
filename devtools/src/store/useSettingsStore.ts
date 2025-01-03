import type { Direction } from '@open-ayame/ayame-web-sdk'
import { create } from 'zustand'

type Settings = {
  audio: {
    isEnable: boolean
    inputDeviceId: string
    outputDeviceId: string
    direction: Direction
    codecMimeType: string
  }
  video: {
    isEnable: boolean
    inputDeviceId: string
    direction: Direction
    codecMimeType: string
  }

  permissionState: {
    microphone: 'granted' | 'denied' | 'prompt' | 'undefined'
    camera: 'granted' | 'denied' | 'prompt' | 'undefined'
  }

  signalingUrl: string
  roomId: string
  clientId: string
  signalingKey: string

  debug: boolean
  standalone: boolean
}

type SettingsStore = {
  settings: Settings

  toggleAudio: (enabled: boolean) => void
  setAudioInputDeviceId: (deviceId: string) => void
  setAudioOutputDeviceId: (deviceId: string) => void
  setAudioDirection: (direction: Direction) => void
  setAudioCodecMimeType: (mimeType: string) => void

  toggleVideo: (enabled: boolean) => void
  setVideoInputDeviceId: (deviceId: string) => void
  setVideoDirection: (direction: Direction) => void
  setVideoCodecMimeType: (mimeType: string) => void

  setMicrophonePermissionState: () => Promise<void>
  setCameraPermissionState: () => Promise<void>

  setSignalingUrl: (url: string) => void

  setRoomId: (roomId: string) => void
  setClientId: (clientId: string) => void
  setSignalingKey: (signalingKey: string) => void

  toggleDebug: (enabled: boolean) => void
  toggleStandalone: (enabled: boolean) => void

  // Copy URL 関連
  generateUrlParams: () => string
  setSettingsFromUrl: (params: URLSearchParams) => void
}

export const useSettingsStore = create<SettingsStore>()((set, get) => ({
  // 初期値
  settings: {
    permissionState: {
      microphone: 'undefined',
      camera: 'undefined',
    },
    audio: {
      isEnable: true,
      inputDeviceId: 'default',
      outputDeviceId: 'default',
      direction: 'sendrecv',
      codecMimeType: 'undefined',
    },
    video: {
      isEnable: true,
      inputDeviceId: 'default',
      direction: 'sendrecv',
      codecMimeType: 'undefined',
    },
    signalingUrl: import.meta.env.VITE_AYAME_SIGNALING_URL || '',
    roomId:
      `${import.meta.env.VITE_AYAME_ROOM_ID_PREFIX}${import.meta.env.VITE_AYAME_ROOM_NAME}` || '',
    clientId: crypto.randomUUID(),
    signalingKey: import.meta.env.VITE_AYAME_SIGNALING_KEY || '',
    debug: false,
    standalone: false,
  },

  setMicrophonePermissionState: async () => {
    const permissionState = await navigator.permissions.query({
      name: 'microphone' as PermissionName,
    })
    set((state) => ({
      settings: {
        ...state.settings,
        permissionState: {
          ...state.settings.permissionState,
          microphone: permissionState.state,
        },
      },
    }))
    // リアルタイムにパーミッションが変わったときに反映するようにする
    permissionState.onchange = () => {
      set((state) => ({
        settings: {
          ...state.settings,
          permissionState: {
            ...state.settings.permissionState,
            microphone: permissionState.state,
          },
        },
      }))
    }
  },

  setCameraPermissionState: async () => {
    const permissionState = await navigator.permissions.query({
      name: 'camera' as PermissionName,
    })
    set((state) => ({
      settings: {
        ...state.settings,
        permissionState: {
          ...state.settings.permissionState,
          camera: permissionState.state,
        },
      },
    }))
    // リアルタイムにパーミッションが変わったときに反映するようにする
    permissionState.onchange = () => {
      set((state) => ({
        settings: {
          ...state.settings,
          permissionState: {
            ...state.settings.permissionState,
            camera: permissionState.state,
          },
        },
      }))
    }
  },

  toggleAudio: (enabled: boolean) =>
    set((state) => ({
      settings: {
        ...state.settings,
        audio: {
          ...state.settings.audio,
          isEnable: enabled,
        },
      },
    })),

  setAudioInputDeviceId: (deviceId: string) =>
    set((state) => ({
      settings: {
        ...state.settings,
        audio: {
          ...state.settings.audio,
          inputDeviceId: deviceId,
        },
      },
    })),

  setAudioOutputDeviceId: (deviceId: string) =>
    set((state) => ({
      settings: {
        ...state.settings,
        audio: {
          ...state.settings.audio,
          outputDeviceId: deviceId,
        },
      },
    })),

  setAudioDirection: (direction: Direction) =>
    set((state) => ({
      settings: {
        ...state.settings,
        audio: {
          ...state.settings.audio,
          direction: direction,
        },
      },
    })),

  setAudioCodecMimeType: (mimeType: string) =>
    set((state) => ({
      settings: {
        ...state.settings,
        audio: {
          ...state.settings.audio,
          codecMimeType: mimeType,
        },
      },
    })),

  toggleVideo: (enabled: boolean) =>
    set((state) => ({
      settings: {
        ...state.settings,
        video: {
          ...state.settings.video,
          isEnable: enabled,
        },
      },
    })),

  setVideoInputDeviceId: (deviceId: string) => {
    set((state) => ({
      settings: {
        ...state.settings,
        video: {
          ...state.settings.video,
          inputDeviceId: deviceId,
        },
      },
    }))
  },

  setVideoDirection: (direction: Direction) =>
    set((state) => ({
      settings: {
        ...state.settings,
        video: {
          ...state.settings.video,
          direction: direction,
        },
      },
    })),

  setVideoCodecMimeType: (mimeType: string) =>
    set((state) => ({
      settings: {
        ...state.settings,
        video: {
          ...state.settings.video,
          codecMimeType: mimeType,
        },
      },
    })),

  setSignalingUrl: (url: string) => {
    set((state) => ({
      settings: {
        ...state.settings,
        signalingUrl: url,
      },
    }))
  },

  setRoomId: (roomId: string) => {
    set((state) => ({
      settings: {
        ...state.settings,
        roomId: roomId,
      },
    }))
  },

  setClientId: (clientId: string) => {
    set((state) => ({
      settings: {
        ...state.settings,
        clientId: clientId,
      },
    }))
  },

  setSignalingKey: (signalingKey: string) => {
    set((state) => ({
      settings: {
        ...state.settings,
        signalingKey: signalingKey,
      },
    }))
  },

  toggleDebug: (enabled: boolean) =>
    set((state) => ({
      settings: {
        ...state.settings,
        debug: enabled,
      },
    })),

  toggleStandalone: (enabled: boolean) =>
    set((state) => ({
      settings: {
        ...state.settings,
        standalone: enabled,
      },
    })),

  generateUrlParams: () => {
    const { settings } = get()
    const params = new URLSearchParams()

    params.set('audio', settings.audio.isEnable.toString())
    params.set('audioDirection', settings.audio.direction)
    params.set('audioCodecMimeType', settings.audio.codecMimeType)

    params.set('video', settings.video.isEnable.toString())
    params.set('videoDirection', settings.video.direction)
    params.set('videoCodecMimeType', settings.video.codecMimeType)

    params.set('signalingUrl', settings.signalingUrl)
    params.set('roomId', settings.roomId)
    params.set('signalingKey', settings.signalingKey)
    params.set('debug', settings.debug.toString())
    params.set('standalone', settings.standalone.toString())

    return params.toString()
  },

  setSettingsFromUrl: (params: URLSearchParams) => {
    set((state) => ({
      settings: {
        ...state.settings,
        audio: {
          ...state.settings.audio,
          isEnable: params.get('audio') !== 'false',
          direction: (params.get('audioDirection') as Direction) || 'sendrecv',
          codecMimeType: params.get('audioCodecMimeType') || 'undefined',
        },
        video: {
          ...state.settings.video,
          isEnable: params.get('video') !== 'false',
          direction: (params.get('videoDirection') as Direction) || 'sendrecv',
          codecMimeType: params.get('videoCodecMimeType') || 'undefined',
        },
        // 項目がなかった場合は今ある値をそのまま利用する
        signalingUrl: params.get('signalingUrl') || state.settings.signalingUrl,
        roomId: params.get('roomId') || state.settings.roomId,
        clientId: params.get('clientId') || state.settings.clientId,
        signalingKey: params.get('signalingKey') || state.settings.signalingKey,
        debug: params.get('debug') === 'true',
        standalone: params.get('standalone') === 'true',
      },
    }))
  },
}))
