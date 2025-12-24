import { audioEnabled } from "../store/signals";

const AudioToggle = () => {
  return (
    <input
      type="checkbox"
      checked={audioEnabled.value}
      onChange={(e) => {
        audioEnabled.value = (e.target as HTMLInputElement).checked;
      }}
    />
  );
};

export default AudioToggle;
