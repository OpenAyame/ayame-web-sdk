import { generateUrlParams } from "../store/signals";

const CopyUrlButton = () => {
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
