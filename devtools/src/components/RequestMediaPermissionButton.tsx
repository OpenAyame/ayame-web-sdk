import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { audioEnabled, videoEnabled, videoResolution } from "../signals";

type Props = {
  buttonText?: string;
};

const RequestMediaPermissionButton = ({ buttonText = "Request media permission" }: Props) => {
  const isPermissionsGranted = useSignal(false);

  useEffect(() => {
    const checkPermissions = async () => {
      // チェックすべきパーミッションを入れる
      const PermissionsToCheck = [];

      // 音声が有効だったらパーミッションのチェックをする
      if (audioEnabled.value) {
        const microphonePermission = await navigator.permissions.query({
          name: "microphone" as PermissionName,
        });
        PermissionsToCheck.push(microphonePermission);
        microphonePermission.onchange = () => {
          // パーミッションが granted でなければボタンを有効にする
          isPermissionsGranted.value = microphonePermission.state === "granted";
        };
      }
      // 映像が有効だったらパーミッションのチェックをする
      if (videoEnabled.value) {
        const cameraPermission = await navigator.permissions.query({
          name: "camera" as PermissionName,
        });
        PermissionsToCheck.push(cameraPermission);
        cameraPermission.onchange = () => {
          // パーミッションが granted でなければボタンを有効にする
          isPermissionsGranted.value = cameraPermission.state === "granted";
        };
      }

      // パーミッションをチェックする必要がなかったら終了
      if (PermissionsToCheck.length === 0) {
        isPermissionsGranted.value = true;
        return;
      }

      // パーミッションのチェックをする
      const allGranted = PermissionsToCheck.every((permission) => permission.state === "granted");
      isPermissionsGranted.value = allGranted;
    };
    void checkPermissions();
  }, []);

  const handleClick = async () => {
    try {
      // ちゃんと有効にしているデバイスのパーミッションだけを取りに行く
      let videoConstraints: boolean | MediaTrackConstraints = videoEnabled.value;
      if (
        videoEnabled.value &&
        videoResolution.value &&
        videoResolution.value !== "undefined"
      ) {
        const [width, height] = videoResolution.value.split("x").map(Number);
        if (width && height) {
          videoConstraints = {
            width: {
              ideal: width,
            },
            height: {
              ideal: height,
            },
          };
        }
      }
      const constraints = {
        audio: audioEnabled.value,
        video: videoConstraints,
      };
      // メディアデバイスのパーミッションを取りに行く
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      // ストリームを停止する
      for (const track of stream.getTracks()) {
        track.stop();
      }
    } catch (error) {
      console.error("Failed to get media devices:", error);
    }
  };

  // <permission> を利用した microphone/camera の権限取得
  if ("HTMLPermissionElement" in window) {
    // @ts-ignore HTMLPermissionElement を認識しないため
    return <permission type="microphone camera" />;
  }

  return (
    <button
      type="button"
      disabled={isPermissionsGranted.value}
      onClick={handleClick}
      class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
    >
      {buttonText}
    </button>
  );
};

export default RequestMediaPermissionButton;
