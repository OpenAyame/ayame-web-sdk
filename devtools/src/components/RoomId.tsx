import { roomId } from "../signals";

const RoomId = () => {
  return (
    <input
      data-testid="room-id"
      type="text"
      class="w-80 px-2 py-1 border border-gray-300 rounded"
      value={roomId.value}
      onChange={(e) => {
        roomId.value = (e.target as HTMLInputElement).value;
      }}
    />
  );
};

export default RoomId;
