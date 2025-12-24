import { standalone } from "../signals";

const StandaloneToggle = () => {
  return (
    <input
      type="checkbox"
      checked={standalone.value}
      onChange={(e) => {
        standalone.value = (e.target as HTMLInputElement).checked;
      }}
    />
  );
};

export default StandaloneToggle;
