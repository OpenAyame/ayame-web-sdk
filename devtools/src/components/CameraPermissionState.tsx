import type React from 'react'
import { useEffect } from 'react'
import { useSettingsStore } from '../store/useSettingsStore'

const CameraPermissionState: React.FC = () => {
  const cameraPermissionState = useSettingsStore((state) => state.settings.permissionState.camera)
  const setCameraPermissionState = useSettingsStore((state) => state.setCameraPermissionState)

  useEffect(() => {
    setCameraPermissionState()
  }, [setCameraPermissionState])

  return <>{cameraPermissionState}</>
}

export default CameraPermissionState
