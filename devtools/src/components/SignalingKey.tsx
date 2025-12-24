import { useStore } from '../store/useStore'

const SignalingKey = () => {
  const signalingKey = useStore((state) => state.settings.signalingKey)
  const setSignalingKey = useStore((state) => state.setSignalingKey)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSignalingKey(e.target.value)
  }

  return (
    <input
      type="password"
      style={{
        width: '350px',
      }}
      value={signalingKey}
      onChange={handleChange}
    />
  )
}

export default SignalingKey
