import type { VNode } from "preact";
import { generateUrlParams } from "../signals";

const CopyUrlButton = (): VNode => {
  const handleClick = (): void => {
    const urlParams = generateUrlParams();
    globalThis.history.replaceState(null, "", `?${urlParams}`);
    void navigator.clipboard.writeText(globalThis.location.href);
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
