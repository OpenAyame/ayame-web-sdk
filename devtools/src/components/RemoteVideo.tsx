import { useRef } from "preact/hooks";
import { useSignalEffect } from "@preact/signals";
import { remoteMediaStream } from "../store/signals";

const RemoteVideo = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useSignalEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = remoteMediaStream.value;
    }
  });

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      style={{
        width: "400px",
        height: "300px",
        border: "1px solid rgb(255, 0, 0)",
      }}
    >
      <track kind="captions" srcLang="ja" label="日本語" default />
    </video>
  );
};

export default RemoteVideo;
