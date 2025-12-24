import { clientId } from "../signals";

const ClientId = () => {
  return (
    <input
      type="text"
      style={{
        width: "350px",
      }}
      value={clientId.value}
      onChange={(e) => {
        clientId.value = (e.target as HTMLInputElement).value;
      }}
    />
  );
};

export default ClientId;
