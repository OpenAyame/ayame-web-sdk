import { useSettingsStore } from '../store/useSettingsStore'

const SignalingKey = () => {
  const signalingKey = useSettingsStore((state) => state.settings.signalingKey)
  const setSignalingKey = useSettingsStore((state) => state.setSignalingKey)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSignalingKey(e.target.value)
  }

  return (
    <input
      type="password"
      style={{ width: '350px' }}
      value={signalingKey}
      onChange={handleChange}
    />
  )
}

export default SignalingKey
