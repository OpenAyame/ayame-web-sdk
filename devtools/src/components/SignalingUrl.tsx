import { useSettingsStore } from '../store/useSettingsStore'

const SignalingUrl = () => {
  const signalingUrl = useSettingsStore((state) => state.settings.signalingUrl)
  const setSignalingUrl = useSettingsStore((state) => state.setSignalingUrl)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSignalingUrl(e.target.value)
  }

  return (
    <input type="text" style={{ width: '350px' }} value={signalingUrl} onChange={handleChange} />
  )
}

export default SignalingUrl
