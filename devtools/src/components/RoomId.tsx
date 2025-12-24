import { roomId } from "../signals";

const RoomId = () => {
  return (
    <input
      data-testid="room-id"
      type="text"
      style={{
        width: "350px",
      }}
      value={roomId.value}
      onChange={(e) => {
        roomId.value = (e.target as HTMLInputElement).value;
      }}
    />
  );
};

export default RoomId;
