import { useSettingsStore } from '../store/useSettingsStore'

export const SignalingUrl = () => {
  const signalingUrl = useSettingsStore((state) => state.settings.signalingUrl)
  const setSignalingUrl = useSettingsStore((state) => state.setSignalingUrl)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSignalingUrl(e.target.value)
  }

  return <input type="text" value={signalingUrl} onChange={handleChange} />
}
