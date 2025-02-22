import { useStore } from '../store/useStore'

const RoomId = () => {
  const roomId = useStore((state) => state.settings.roomId)
  const setRoomId = useStore((state) => state.setRoomId)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRoomId(e.target.value)
  }

  return (
    <input
      data-testid="room-id"
      type="text"
      style={{ width: '350px' }}
      value={roomId}
      onChange={handleChange}
    />
  )
}

export default RoomId
