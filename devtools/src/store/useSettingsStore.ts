import { create } from 'zustand'

type Settings = {
  audio: {
    isEnable: boolean
    codecMimeType: string
  }
  video: {
    isEnable: boolean
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
  setAudioCodecMimeType: (mimeType: string) => void

  toggleVideo: (enabled: boolean) => void
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
      codecMimeType: 'undefined',
    },
    video: {
      isEnable: true,
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
    params.set('audioCodecMimeType', settings.audio.codecMimeType)

    params.set('video', settings.video.isEnable.toString())
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
          codecMimeType: params.get('audioCodecMimeType') || 'undefined',
        },
        video: {
          ...state.settings.video,
          isEnable: params.get('video') !== 'false',
          codecMimeType: params.get('videoCodecMimeType') || 'undefined',
        },
      },
    })),
}))
