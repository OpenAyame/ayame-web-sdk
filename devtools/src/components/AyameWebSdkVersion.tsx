import { version } from "@open-ayame/ayame-web-sdk";
import { ayameVersion } from "../store/signals";

ayameVersion.value = version();

const AyameVersion = () => {
  return <span data-testid="ayame-web-sdk-version">{version()}</span>;
};

export default AyameVersion;
