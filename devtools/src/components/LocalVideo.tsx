import type React from 'react'

const LocalVideo: React.FC = () => {
  return (
    <video
      autoPlay
      muted
      playsInline
      style={{ width: '400px', height: '300px', border: '1px solid rgb(0, 0, 255)' }}
    />
  )
}

export default LocalVideo
