import { useSettingsStore } from '../store/useSettingsStore'

const RoomId = () => {
  const roomId = useSettingsStore((state) => state.settings.roomId)
  const setRoomId = useSettingsStore((state) => state.setRoomId)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRoomId(e.target.value)
  }

  return <input type="text" style={{ width: '350px' }} value={roomId} onChange={handleChange} />
}

export default RoomId
