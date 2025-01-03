import type React from 'react'
import { useEffect, useState } from 'react'
import { useSettingsStore } from '../store/useSettingsStore'

const VideoInputDevice: React.FC = () => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const setVideoInputDeviceId = useSettingsStore((state) => state.setVideoInputDeviceId)
  const videoInputDeviceId = useSettingsStore((state) => state.settings.video.inputDeviceId)

  useEffect(() => {
    const getDevices = async () => {
      const permissionStatus = await navigator.permissions.query({
        name: 'camera' as PermissionName,
      })

      const handlePermissionChange = async () => {
        if (permissionStatus.state === 'granted') {
          const devices = await navigator.mediaDevices.enumerateDevices()
          const videoInputDevices = devices.filter((device) => device.kind === 'videoinput')
          setDevices(videoInputDevices)
        } else {
          setDevices([])
        }
      }

      // 初期状態の処理
      handlePermissionChange()

      // 権限変更の監視
      permissionStatus.onchange = handlePermissionChange

      return () => {
        // ククリーンアップ
        permissionStatus.onchange = null
      }
    }
    getDevices()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setVideoInputDeviceId(e.target.value)
  }

  return (
    <select onChange={handleChange} value={videoInputDeviceId}>
      {devices.map((device) => (
        <option key={device.deviceId} value={device.deviceId}>
          {device.label || `Camera ${device.deviceId}`}
        </option>
      ))}
    </select>
  )
}

export default VideoInputDevice
