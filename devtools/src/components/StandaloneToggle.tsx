import type React from 'react'
import { useSettingsStore } from '../store/useSettingsStore.js'

const StandaloneToggle: React.FC = () => {
  const isEnable = useSettingsStore((state) => state.settings.standalone)
  const toggleStandalone = useSettingsStore((state) => state.toggleStandalone)

  return (
    <input type="checkbox" checked={isEnable} onChange={(e) => toggleStandalone(e.target.checked)} />
  )
}

export default StandaloneToggle
