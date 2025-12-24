import type React from "react";
import { useEffect } from "react";
import { useStore } from "../store/useStore";

const MicrophonePermissionState: React.FC = () => {
  const microphonePermissionState = useStore((state) => state.permissionState.microphoneState);
  const setMicrophonePermissionState = useStore((state) => state.setMicrophonePermissionState);

  useEffect(() => {
    void setMicrophonePermissionState();
  }, [setMicrophonePermissionState]);

  return <>{microphonePermissionState}</>;
};

export default MicrophonePermissionState;
