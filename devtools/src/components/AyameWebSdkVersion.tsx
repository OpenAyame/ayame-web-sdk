import type { VNode } from "preact";
import { version } from "@open-ayame/ayame-web-sdk";

const AyameVersion = (): VNode => <span data-testid="ayame-web-sdk-version">{version()}</span>;

export default AyameVersion;
