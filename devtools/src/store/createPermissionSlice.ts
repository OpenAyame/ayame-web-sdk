import type { StateCreator } from 'zustand'

export interface PermissionSlice {
  permissionState: {
    microphoneState: PermissionState | undefined
    cameraState: PermissionState | undefined
  }

  setMicrophonePermissionState: () => Promise<void>
  setCameraPermissionState: () => Promise<void>
}

export const createPermissionSlice: StateCreator<PermissionSlice> = (set) => ({
  permissionState: {
    microphoneState: undefined,
    cameraState: undefined,
  },

  setMicrophonePermissionState: async () => {
    const permissionStatus = await navigator.permissions.query({
      name: 'microphone' as PermissionName,
    })
    set((state) => ({
      permissionState: {
        ...state.permissionState,
        microphoneState: permissionStatus.state,
      },
    }))
    // リアルタイムにパーミッションが変わったときに反映するようにする
    permissionStatus.onchange = () => {
      set((state) => ({
        permissionState: {
          ...state.permissionState,
          microphoneState: permissionStatus.state,
        },
      }))
    }
  },

  setCameraPermissionState: async () => {
    const permissionStatus = await navigator.permissions.query({
      name: 'camera' as PermissionName,
    })
    set((state) => ({
      permissionState: {
        ...state.permissionState,
        cameraState: permissionStatus.state,
      },
    }))
    // リアルタイムにパーミッションが変わったときに反映するようにする
    permissionStatus.onchange = () => {
      set((state) => ({
        permissionState: {
          ...state.permissionState,
          cameraState: permissionStatus.state,
        },
      }))
    }
  },
})
