import type React from "react";
import { useEffect } from "react";
import { useStore } from "../store/useStore";

const CameraPermissionState: React.FC = () => {
  const cameraPermissionState = useStore((state) => state.permissionState.cameraState);
  const setCameraPermissionState = useStore((state) => state.setCameraPermissionState);

  useEffect(() => {
    void setCameraPermissionState();
  }, [setCameraPermissionState]);

  return <>{cameraPermissionState}</>;
};

export default CameraPermissionState;
