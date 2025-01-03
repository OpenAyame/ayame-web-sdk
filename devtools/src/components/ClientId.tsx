import { useSettingsStore } from '../store/useSettingsStore'

const ClientId = () => {
  const clientId = useSettingsStore((state) => state.settings.clientId)
  const setClientId = useSettingsStore((state) => state.setClientId)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setClientId(e.target.value)
  }

  return <input type="text" style={{ width: '350px' }} value={clientId} onChange={handleChange} />
}

export default ClientId
