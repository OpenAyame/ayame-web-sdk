import type React from 'react'
import { useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'

const LocalVideo: React.FC = () => {
  const localMediaStream = useStore((state) => state.mediaStream.local)
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
      style={{
        width: '400px',
        height: '300px',
        border: '1px solid rgb(0, 0, 255)',
        // 鏡表示にする
        transform: 'scaleX(-1)',
      }}
    />
  )
}

export default LocalVideo
