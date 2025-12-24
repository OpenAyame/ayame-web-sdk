import type React from "react";
import { useStore } from "../store/useStore";

const CopyUrlButton: React.FC = () => {
  const generateUrlParams = useStore((state) => state.generateUrlParams);

  const handleClick = () => {
    const urlParams = generateUrlParams();
    window.history.replaceState(null, "", `?${urlParams}`);
    void navigator.clipboard.writeText(window.location.href);
  };

  return (
    <button type="button" onClick={handleClick}>
      Copy URL
    </button>
  );
};

export default CopyUrlButton;
