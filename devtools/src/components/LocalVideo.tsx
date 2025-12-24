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
      class="w-[400px] h-[300px] border border-blue-500 -scale-x-100"
    />
  );
};

export default LocalVideo;
