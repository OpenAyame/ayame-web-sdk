import { generateUrlParams } from "../signals";

const CopyUrlButton = () => {
  const handleClick = () => {
    const urlParams = generateUrlParams();
    window.history.replaceState(null, "", `?${urlParams}`);
    void navigator.clipboard.writeText(window.location.href);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
    >
      Copy URL
    </button>
  );
};

export default CopyUrlButton;
