import type React from 'react'
import { useEffect, useRef } from 'react'
import { useAyameStore } from '../store/useAyameStore'

const LocalVideo: React.FC = () => {
  const localMediaStream = useAyameStore((state) => state.localMediaStream)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = localMediaStream
    }
  }, [localMediaStream])

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      playsInline
      style={{ width: '400px', height: '300px', border: '1px solid rgb(0, 0, 255)' }}
    />
  )
}

export default LocalVideo
