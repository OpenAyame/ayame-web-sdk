import { useStore } from "../store/useStore";

const SignalingUrl = () => {
  const signalingUrl = useStore((state) => state.settings.signalingUrl);
  const setSignalingUrl = useStore((state) => state.setSignalingUrl);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSignalingUrl(e.target.value);
  };

  return (
    <input
      type="text"
      style={{
        width: "350px",
      }}
      value={signalingUrl}
      onChange={handleChange}
    />
  );
};

export default SignalingUrl;
