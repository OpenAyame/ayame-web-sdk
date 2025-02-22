import { useStore } from '../store/useStore'

const ClientId = () => {
  const clientId = useStore((state) => state.settings.clientId)
  const setClientId = useStore((state) => state.setClientId)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setClientId(e.target.value)
  }

  return <input type="text" style={{ width: '350px' }} value={clientId} onChange={handleChange} />
}

export default ClientId
