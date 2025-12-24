import { debug } from "../store/signals";

const DebugToggle = () => {
  return (
    <input
      type="checkbox"
      checked={debug.value}
      onChange={(e) => {
        debug.value = (e.target as HTMLInputElement).checked;
      }}
    />
  );
};

export default DebugToggle;
