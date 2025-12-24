import { microphonePermissionState, setMicrophonePermissionState } from "../signals";

void setMicrophonePermissionState();

const MicrophonePermissionState = () => {
  return <>{microphonePermissionState.value}</>;
};

export default MicrophonePermissionState;
