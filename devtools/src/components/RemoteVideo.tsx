import { useRef } from "preact/hooks";
import { useSignalEffect } from "@preact/signals";
import { remoteMediaStream } from "../signals";

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
      class="w-[400px] h-[300px] border border-red-500"
    >
      <track kind="captions" srcLang="ja" label="日本語" default />
    </video>
  );
};

export default RemoteVideo;
