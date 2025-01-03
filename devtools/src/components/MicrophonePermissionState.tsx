import type React from 'react'
import { useEffect } from 'react'
import { useSettingsStore } from '../store/useSettingsStore'

const MicrophonePermissionState: React.FC = () => {
  const microphonePermissionState = useSettingsStore(
    (state) => state.settings.permissionState.microphone,
  )
  const setMicrophonePermissionState = useSettingsStore(
    (state) => state.setMicrophonePermissionState,
  )

  useEffect(() => {
    setMicrophonePermissionState()
  }, [setMicrophonePermissionState])

  return <>{microphonePermissionState}</>
}

export default MicrophonePermissionState
