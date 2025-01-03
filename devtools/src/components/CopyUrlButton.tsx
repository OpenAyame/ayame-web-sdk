import type React from 'react'
import { useSettingsStore } from '../store/useSettingsStore.js'

const CopyUrlButton: React.FC = () => {
  const generateUrlParams = useSettingsStore((state) => state.generateUrlParams)

  const handleClick = () => {
    const urlParams = generateUrlParams()
    window.history.replaceState(null, '', `?${urlParams}`)
    navigator.clipboard.writeText(window.location.href)
  }

  return (
    <button type="button" onClick={handleClick}>
      Copy URL
    </button>
  )
}

export default CopyUrlButton
