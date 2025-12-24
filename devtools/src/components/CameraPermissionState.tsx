import { cameraPermissionState, setCameraPermissionState } from "../signals";

void setCameraPermissionState();

const CameraPermissionState = () => {
  return <>{cameraPermissionState.value}</>;
};

export default CameraPermissionState;
