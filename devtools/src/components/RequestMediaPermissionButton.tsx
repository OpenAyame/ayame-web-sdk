import type React from 'react'
import { useEffect, useState } from 'react'
import { useSettingsStore } from '../store/useSettingsStore'

const RequestMediaPermissionButton: React.FC<{
  buttonText?: string
}> = ({ buttonText = 'Request media permission' }) => {
  const isAudioEnabled = useSettingsStore((state) => state.settings.audio.isEnable)
  const isVideoEnabled = useSettingsStore((state) => state.settings.video.isEnable)
  const [isPermissionsGranted, setIsPermissionsGranted] = useState(false)

  useEffect(() => {
    const checkPermissions = async () => {
      // チェックすべきパーミッションを入れる
      const PermissionsToCheck = []

      // 音声が有効だったらパーミッションのチェックをする
      if (isAudioEnabled) {
        const microphonePermission = await navigator.permissions.query({
          name: 'microphone' as PermissionName,
        })
        PermissionsToCheck.push(microphonePermission)
        microphonePermission.onchange = () => {
          // パーミッションが granted でなければボタンを有効にする
          setIsPermissionsGranted(microphonePermission.state === 'granted')
        }
      }
      // 映像が有効だったらパーミッションのチェックをする
      if (isVideoEnabled) {
        const cameraPermission = await navigator.permissions.query({
          name: 'camera' as PermissionName,
        })
        PermissionsToCheck.push(cameraPermission)
        cameraPermission.onchange = () => {
          // パーミッションが granted でなければボタンを有効にする
          setIsPermissionsGranted(cameraPermission.state === 'granted')
        }
      }

      // パーミッションをチェックする必要がなかったら終了
      if (PermissionsToCheck.length === 0) {
        setIsPermissionsGranted(true)
        return
      }

      // パーミッションのチェックをする
      const allGranted = PermissionsToCheck.every((permission) => permission.state === 'granted')
      setIsPermissionsGranted(allGranted)
    }
    checkPermissions()
  }, [isAudioEnabled, isVideoEnabled])

  const handleClick = async () => {
    try {
      // ちゃんと有効にしているデバイスのパーミッションだけを取りに行く
      const constraints = {
        audio: isAudioEnabled,
        video: isVideoEnabled,
      }
      // メディアデバイスのパーミッションを取りに行く
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      for (const track of stream.getTracks()) {
        track.stop()
      }
    } catch (error) {
      console.error('Failed to get media devices:', error)
    }
  }

  return (
    <button type="button" disabled={isPermissionsGranted} onClick={handleClick}>
      {buttonText}
    </button>
  )
}

export default RequestMediaPermissionButton
