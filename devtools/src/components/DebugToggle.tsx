import type React from "react";
import { useStore } from "../store/useStore";

const DebugToggle: React.FC = () => {
  const isEnable = useStore((state) => state.settings.debug);
  const toggleDebug = useStore((state) => state.toggleDebug);

  return (
    <input type="checkbox" checked={isEnable} onChange={(e) => toggleDebug(e.target.checked)} />
  );
};

export default DebugToggle;
