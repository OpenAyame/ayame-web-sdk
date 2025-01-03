import type { Connection } from '@open-ayame/ayame-web-sdk'
import { create } from 'zustand'

type AyameStore = {
  ayameConnection: Connection | null

  localMediaStream: MediaStream | null
  remoteMediaStream: MediaStream | null

  connectionState: RTCPeerConnectionState

  setAyameConnection: (conn: Connection | null) => void

  setLocalMediaStream: (stream: MediaStream | null) => void
  setRemoteMediaStream: (stream: MediaStream | null) => void

  setConnectionState: (state: RTCPeerConnectionState) => void
}

export const useAyameStore = create<AyameStore>()((set, get) => ({
  ayameConnection: null,

  // とりあえず初期値なので new にしておく
  connectionState: 'new' as RTCPeerConnectionState,

  localMediaStream: null,
  remoteMediaStream: null,

  setAyameConnection: (conn: Connection | null) => {
    set({ ayameConnection: conn })
  },

  setConnectionState: (state: RTCPeerConnectionState) => {
    set({ connectionState: state })
  },

  setLocalMediaStream: (stream: MediaStream | null) => {
    set({ localMediaStream: stream })
  },
  setRemoteMediaStream: (stream: MediaStream | null) => {
    set({ remoteMediaStream: stream })
  },
}))

// ストアの作成後に subscribe を設定
useAyameStore.subscribe((state, prevState) => {
  if (state.localMediaStream !== prevState.localMediaStream) {
    console.log('localMediaStream changed:', {
      from: prevState.localMediaStream,
      to: state.localMediaStream,
      stack: new Error().stack,
    })
  }
  if (state.remoteMediaStream !== prevState.remoteMediaStream) {
    console.log('remoteMediaStream changed:', {
      from: prevState.remoteMediaStream,
      to: state.remoteMediaStream,
      stack: new Error().stack,
    })
  }
})
