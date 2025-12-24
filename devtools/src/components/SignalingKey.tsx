import { signalingKey } from "../signals";

const SignalingKey = () => {
  return (
    <input
      type="password"
      class="w-80 px-2 py-1 border border-gray-300 rounded"
      value={signalingKey.value}
      onChange={(e) => {
        signalingKey.value = (e.target as HTMLInputElement).value;
      }}
    />
  );
};

export default SignalingKey;
