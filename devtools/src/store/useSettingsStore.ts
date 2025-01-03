import type { Direction } from '@open-ayame/ayame-web-sdk'
import { create } from 'zustand'

type Settings = {
  audio: {
    isEnable: boolean
    direction: Direction
    codecMimeType: string
  }
  video: {
    isEnable: boolean
    direction: Direction
    codecMimeType: string
  }
  permissionState: {
    microphone: 'granted' | 'denied' | 'prompt' | 'undefined'
    camera: 'granted' | 'denied' | 'prompt' | 'undefined'
  }
}

type SettingsStore = {
  settings: Settings

  toggleAudio: (enabled: boolean) => void
  setAudioDirection: (direction: Direction) => void
  setAudioCodecMimeType: (mimeType: string) => void

  toggleVideo: (enabled: boolean) => void
  setVideoDirection: (direction: Direction) => void
  setVideoCodecMimeType: (mimeType: string) => void

  setMicrophonePermissionState: () => Promise<void>
  setCameraPermissionState: () => Promise<void>

  // Copy URL 関連
  generateUrlParams: () => string
  setSettingsFromUrl: (params: URLSearchParams) => void
}

export const useSettingsStore = create<SettingsStore>()((set, get) => ({
  settings: {
    permissionState: {
      microphone: 'undefined',
      camera: 'undefined',
    },
    audio: {
      isEnable: true,
      direction: 'sendrecv',
      codecMimeType: 'undefined',
    },
    video: {
      isEnable: true,
      direction: 'sendrecv',
      codecMimeType: 'undefined',
    },
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

  generateUrlParams: () => {
    const { settings } = get()
    const params = new URLSearchParams()

    params.set('audio', settings.audio.isEnable.toString())
    params.set('audioDirection', settings.audio.direction)
    params.set('audioCodecMimeType', settings.audio.codecMimeType)

    params.set('video', settings.video.isEnable.toString())
    params.set('videoDirection', settings.video.direction)
    params.set('videoCodecMimeType', settings.video.codecMimeType)

    return params.toString()
  },

  setSettingsFromUrl: (params: URLSearchParams) =>
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
      },
    })),
}))
