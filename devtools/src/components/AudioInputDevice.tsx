import type React from 'react'
import { useEffect, useState } from 'react'
import { useSettingsStore } from '../store/useSettingsStore'

const AudioInputDevice: React.FC = () => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const setAudioInputDeviceId = useSettingsStore((state) => state.setAudioInputDeviceId)
  const audioInputDeviceId = useSettingsStore((state) => state.settings.audio.inputDeviceId)

  useEffect(() => {
    const getDevices = async () => {
      const permissionStatus = await navigator.permissions.query({
        name: 'microphone' as PermissionName,
      })

      const handlePermissionChange = async () => {
        if (permissionStatus.state === 'granted') {
          const devices = await navigator.mediaDevices.enumerateDevices()
          const audioInputDevices = devices.filter((device) => device.kind === 'audioinput')
          setDevices(audioInputDevices)
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
    setAudioInputDeviceId(e.target.value)
  }

  return (
    <select onChange={handleChange} value={audioInputDeviceId}>
      {devices.map((device) => (
        <option key={device.deviceId} value={device.deviceId}>
          {device.label || `Microphone ${device.deviceId}`}
        </option>
      ))}
    </select>
  )
}

export default AudioInputDevice
