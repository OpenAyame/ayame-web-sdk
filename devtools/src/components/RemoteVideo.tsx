import type React from 'react'
import { useEffect, useRef } from 'react'
import { useAyameStore } from '../store/useAyameStore'

const RemoteVideo: React.FC = () => {
  const remoteMediaStream = useAyameStore((state) => state.remoteMediaStream)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = remoteMediaStream
    }
  }, [remoteMediaStream])

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      style={{ width: '400px', height: '300px', border: '1px solid rgb(255, 0, 0)' }}
    >
      <track kind="captions" srcLang="ja" label="日本語" default />
    </video>
  )
}

export default RemoteVideo
