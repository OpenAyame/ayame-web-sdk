import type React from "react";
import { useStore } from "../store/useStore";

const StandaloneToggle: React.FC = () => {
  const isEnable = useStore((state) => state.settings.standalone);
  const toggleStandalone = useStore((state) => state.toggleStandalone);

  return (
    <input
      type="checkbox"
      checked={isEnable}
      onChange={(e) => toggleStandalone(e.target.checked)}
    />
  );
};

export default StandaloneToggle;
