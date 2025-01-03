import type React from 'react'

const RemoteVideo: React.FC = () => {
  return (
    <video
      autoPlay
      muted
      playsInline
      style={{ width: '400px', height: '300px', border: '1px solid rgb(255, 0, 0)' }}
    />
  )
}

export default RemoteVideo
