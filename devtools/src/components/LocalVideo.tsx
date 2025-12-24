import { useRef } from "preact/hooks";
import { useSignalEffect } from "@preact/signals";
import { localMediaStream } from "../signals";

const LocalVideo = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useSignalEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = localMediaStream.value;
    }
  });

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      playsInline
      style={{
        width: "400px",
        height: "300px",
        border: "1px solid rgb(0, 0, 255)",
        // 鏡表示にする
        transform: "scaleX(-1)",
      }}
    />
  );
};

export default LocalVideo;
