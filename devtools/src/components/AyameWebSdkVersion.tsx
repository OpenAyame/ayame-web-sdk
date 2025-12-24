import { version } from "@open-ayame/ayame-web-sdk";
import { useEffect } from "react";
import { useStore } from "../store/useStore";
const AyameVersion = () => {
  const ayameVersion = useStore((state) => state.ayame.version);
  const setAyameVersion = useStore((state) => state.setAyameVersion);

  useEffect(() => {
    setAyameVersion(version());
  }, [setAyameVersion]);

  return <span data-testid="ayame-web-sdk-version">{version()}</span>;
};

export default AyameVersion;
