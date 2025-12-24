import { cameraPermissionState, setCameraPermissionState } from "../store/signals";

void setCameraPermissionState();

const CameraPermissionState = () => {
  return <>{cameraPermissionState.value}</>;
};

export default CameraPermissionState;
