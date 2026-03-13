/**
 * ブラウザを判定する
 */
export function browser(): string {
  const ua = globalThis.navigator.userAgent.toLocaleLowerCase();
  if (ua.includes("edge")) {
    return "edge";
  }
  if (ua.includes("chrome") && !ua.includes("edge")) {
    return "chrome";
  }
  if (ua.includes("safari") && !ua.includes("chrome")) {
    return "safari";
  }
  if (ua.includes("opera")) {
    return "opera";
  }
  if (ua.includes("firefox")) {
    return "firefox";
  }
  return "unknown";
}

/**
 * デバッグログを出力する
 */
export function traceLog(title: string, value?: unknown): void {
  const prefix = `[Ayame ${(globalThis.performance.now() / 1000).toFixed(3)}]`;
  if (browser() === "edge") {
    // eslint-disable-next-line no-console -- デバッグログ出力
    console.log(`${prefix} ${title}\n`, value);
  } else {
    // eslint-disable-next-line no-console -- デバッグログ出力
    console.info(`${prefix} ${title}\n`, value);
  }
}

/**
 * 指定された codec にマッチする codec のリストを返す
 * リストなのはプロファイルが複数合ったり、 RTX, RED, ULPFEC などの codec も含めるため
 */
export const getSelectedCodecs = (
  kind: "audio" | "video",
  selectedCodecMimeType: string,
  codecs: RTCRtpCodecCapability[],
): RTCRtpCodecCapability[] => {
  const filteredCodecs = codecs.filter((codec) => {
    const codecMimeType = codec.mimeType.toLowerCase();

    // 指定された codec はマッチしたら true
    if (codecMimeType === selectedCodecMimeType.toLowerCase()) {
      return true;
    }

    // Rtx, red, ulpfec は常に true にする
    if (
      codecMimeType === `${kind}/rtx` ||
      codecMimeType === `${kind}/red` ||
      codecMimeType === `${kind}/ulpfec`
    ) {
      return true;
    }

    return false;
  });
  return filteredCodecs;
};

/**
 * 利用可能な映像のコーデックを取得する
 */
export const getAvailableCodecs = (
  kind: "audio" | "video",
  direction: "sender" | "receiver",
): string[] => {
  if (typeof RTCRtpSender === "undefined" || typeof RTCRtpReceiver === "undefined") {
    return [];
  }

  // Sendrecv と sendonly は RTCRtpSender を使う
  // Recvonly は RTCRtpReceiver を使う
  const codecs =
    direction === "sender"
      ? RTCRtpSender.getCapabilities(kind)?.codecs
      : RTCRtpReceiver.getCapabilities(kind)?.codecs;
  if (!codecs) {
    return [];
  }

  return (
    codecs
      .filter((codec) => {
        // MimeType は insensitive-case なので lowerCase に変換する
        const codecType = codec.mimeType.toLowerCase();

        // Rtx/red/ulpfec はフィルターとして削除する
        if (
          codecType === `${kind}/rtx` ||
          codecType === `${kind}/red` ||
          codecType === `${kind}/ulpfec`
        ) {
          return false;
        }

        return true;
      })
      // MimeType が既に存在している場合は重複を削除する
      .filter(
        (codec, index, self) =>
          index === self.findIndex((target) => target.mimeType === codec.mimeType),
      )
      .map((codec) => codec.mimeType)
      .toSorted()
  );
};
