import { signalingKey } from "../store/signals";

const SignalingKey = () => {
  return (
    <input
      type="password"
      style={{
        width: "350px",
      }}
      value={signalingKey.value}
      onChange={(e) => {
        signalingKey.value = (e.target as HTMLInputElement).value;
      }}
    />
  );
};

export default SignalingKey;
