import { microphonePermissionState, setMicrophonePermissionState } from "../store/signals";

void setMicrophonePermissionState();

const MicrophonePermissionState = () => {
  return <>{microphonePermissionState.value}</>;
};

export default MicrophonePermissionState;
