import type { StateCreator } from 'zustand'

export interface MediaDeviceSlice {
  mediaDevice: {
    audioInputDeviceId: string
    audioOutputDeviceId: string

    videoInputDeviceId: string
  }

  setAudioInputDeviceId: (deviceId: string) => void
  setAudioOutputDeviceId: (deviceId: string) => void

  setVideoInputDeviceId: (deviceId: string) => void
}

export const createMediaDeviceSlice: StateCreator<MediaDeviceSlice> = (set, get) => ({
  // 初期値
  mediaDevice: {
    audioInputDeviceId: 'default',
    audioOutputDeviceId: 'default',
    videoInputDeviceId: 'default',
  },

  setAudioInputDeviceId: (deviceId: string) =>
    set((state) => ({
      mediaDevice: {
        ...state.mediaDevice,
        audioInputDeviceId: deviceId,
      },
    })),

  setAudioOutputDeviceId: (deviceId: string) =>
    set((state) => ({
      mediaDevice: {
        ...state.mediaDevice,
        audioOutputDeviceId: deviceId,
      },
    })),

  setVideoInputDeviceId: (deviceId: string) => {
    set((state) => ({
      mediaDevice: {
        ...state.mediaDevice,
        videoInputDeviceId: deviceId,
      },
    }))
  },
})
