import { signalingUrl } from "../signals";

const SignalingUrl = () => {
  return (
    <input
      type="text"
      style={{
        width: "350px",
      }}
      value={signalingUrl.value}
      onChange={(e) => {
        signalingUrl.value = (e.target as HTMLInputElement).value;
      }}
    />
  );
};

export default SignalingUrl;
