import type React from 'react'
import { useSettingsStore } from '../store/useSettingsStore.js'

const DebugToggle: React.FC = () => {
  const isEnable = useSettingsStore((state) => state.settings.debug)
  const toggleDebug = useSettingsStore((state) => state.toggleDebug)

  return (
    <input type="checkbox" checked={isEnable} onChange={(e) => toggleDebug(e.target.checked)} />
  )
}

export default DebugToggle
