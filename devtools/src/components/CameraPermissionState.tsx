import type { VNode } from "preact";
import { cameraPermissionState, setCameraPermissionState } from "../signals";

void setCameraPermissionState();

const CameraPermissionState = (): VNode => <>{cameraPermissionState.value}</>;

export default CameraPermissionState;
