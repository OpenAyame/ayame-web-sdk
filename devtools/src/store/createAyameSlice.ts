import type { Connection, version } from '@open-ayame/ayame-web-sdk'
import type { StateCreator } from 'zustand'

export interface AyameSlice {
  ayame: {
    version: string
    connection: Connection | null
    connectionState: RTCPeerConnectionState
  }

  mediaStream: {
    local: MediaStream | null
    remote: MediaStream | null
  }

  setAyameVersion: (version: string) => void
  setAyameConnection: (conn: Connection | null) => void
  setAyameConnectionState: (state: RTCPeerConnectionState) => void

  setLocalMediaStream: (stream: MediaStream | null) => void
  setRemoteMediaStream: (stream: MediaStream | null) => void
}

export const createAyameSlice: StateCreator<AyameSlice> = (set, get) => ({
  ayame: {
    version: '',
    connection: null,
    // とりあえず初期値なので new にしておく
    connectionState: 'new' as RTCPeerConnectionState,
  },

  mediaStream: {
    local: null,
    remote: null,
  },

  localMediaStream: null,
  remoteMediaStream: null,

  setAyameVersion: (version: string) => {
    set((state) => ({
      ayame: {
        ...state.ayame,
        version,
      },
    }))
  },

  setAyameConnection: (conn: Connection | null) => {
    set((state) => ({
      ayame: {
        ...state.ayame,
        connection: conn,
      },
    }))
  },

  setAyameConnectionState: (connectionState: RTCPeerConnectionState) => {
    set((state) => ({
      ayame: {
        ...state.ayame,
        connectionState: connectionState,
      },
    }))
  },

  setLocalMediaStream: (stream: MediaStream | null) => {
    set((state) => ({
      mediaStream: {
        ...state.mediaStream,
        local: stream,
      },
    }))
  },
  setRemoteMediaStream: (stream: MediaStream | null) => {
    set((state) => ({
      mediaStream: {
        ...state.mediaStream,
        remote: stream,
      },
    }))
  },
})

// デバッグ用の subscribe 設定
// ストアの作成後に subscribe を設定
// useAyameStore.subscribe((state, prevState) => {
//   if (state.localMediaStream !== prevState.localMediaStream) {
//     console.log('localMediaStream changed:', {
//       from: prevState.localMediaStream,
//       to: state.localMediaStream,
//       stack: new Error().stack,
//     })
//   }
//   if (state.remoteMediaStream !== prevState.remoteMediaStream) {
//     console.log('remoteMediaStream changed:', {
//       from: prevState.remoteMediaStream,
//       to: state.remoteMediaStream,
//       stack: new Error().stack,
//     })
//   }
// })
