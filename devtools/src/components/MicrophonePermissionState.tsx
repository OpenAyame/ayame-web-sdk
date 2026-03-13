import type { VNode } from "preact";
import { microphonePermissionState, setMicrophonePermissionState } from "../signals";

void setMicrophonePermissionState();

const MicrophonePermissionState = (): VNode => <>{microphonePermissionState.value}</>;

export default MicrophonePermissionState;
