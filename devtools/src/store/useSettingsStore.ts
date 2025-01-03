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
}

type SettingsStore = {
  settings: Settings

  toggleAudio: (enabled: boolean) => void
  toggleVideo: (enabled: boolean) => void

  setAudioCodecMimeType: (mimeType: string) => void
  setVideoCodecMimeType: (mimeType: string) => void

  // Copy URL 関連
  generateUrlParams: () => string
  setSettingsFromUrl: (params: URLSearchParams) => void
}

export const useSettingsStore = create<SettingsStore>()((set, get) => ({
  settings: {
    audio: {
      isEnable: true,
      codecMimeType: 'undefined',
    },
    video: {
      isEnable: true,
      codecMimeType: 'undefined',
    },
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
