/**
 * @ignore
 */
interface Window {
  performance: WindowPerformance
  navigator: any
}
interface WindowPerformance {
  now(): number
}
declare let window: Window

/**
 * @ignore
 */
export function randomString(strLength: number): string {
  const result = []
  const charSet = '0123456789'
  let length = strLength
  while (length--) {
    result.push(charSet.charAt(Math.floor(Math.random() * charSet.length)))
  }
  return result.join('')
}

/**
 * @ignore
 */
export function browser(): string {
  const ua = window.navigator.userAgent.toLocaleLowerCase()
  if (ua.indexOf('edge') !== -1) {
    return 'edge'
  }
  if (ua.indexOf('chrome') !== -1 && ua.indexOf('edge') === -1) {
    return 'chrome'
  }
  if (ua.indexOf('safari') !== -1 && ua.indexOf('chrome') === -1) {
    return 'safari'
  }
  if (ua.indexOf('opera') !== -1) {
    return 'opera'
  }
  if (ua.indexOf('firefox') !== -1) {
    return 'firefox'
  }
  return 'unknown'
}

/**
 * @ignore
 */
export function traceLog(title: string, value?: string | Record<string, any>): void {
  let prefix = ''
  if (window.performance) {
    prefix = `[Ayame ${(window.performance.now() / 1000).toFixed(3)}]`
  }
  if (browser() === 'edge') {
    console.log(`${prefix} ${title}\n`, value)
  } else {
    console.info(`${prefix} ${title}\n`, value)
  }
}

// 指定された codec にマッチする codec のリストを返す
// リストなのはプロファイルが複数合ったり、 RTX, RED, ULPFEC などの codec も含めるため
export const getSelectedCodecs = (
  selectedCodecMimeType: string,
  codecs: RTCRtpCodec[],
): RTCRtpCodecCapability[] => {
  const filteredCodecs = codecs.filter((c) => {
    const codecMimeType = c.mimeType.toLowerCase()

    // 指定された codec はマッチしたら true
    if (codecMimeType === selectedCodecMimeType.toLowerCase()) {
      return true
    }

    // rtx, red, ulpfec は常に true にする
    if (
      codecMimeType === 'video/rtx' ||
      codecMimeType === 'video/red' ||
      codecMimeType === 'video/ulpfec'
    ) {
      return true
    }

    return false
  })
  return filteredCodecs
}

// https://developer.mozilla.org/en-US/docs/Web/API/RTCRtpTransceiver/direction
export enum Direction {
  Sendrecv = 'sendrecv',
  Recvonly = 'recvonly',
  Sendonly = 'sendonly',
}

// 利用者向けのライブラリ
export const getAvailableVideoCodecs = (direction: Direction): string[] => {
  if (typeof RTCRtpSender === 'undefined' || typeof RTCRtpReceiver === 'undefined') {
    return []
  }

  // sendrecv と sendonly は RTCRtpSender を使う
  // recvonly は RTCRtpReceiver を使う
  const getCapabilities =
    direction === Direction.Sendrecv || direction === Direction.Sendonly
      ? RTCRtpSender.getCapabilities
      : RTCRtpReceiver.getCapabilities

  if (typeof getCapabilities !== 'function') {
    return []
  }

  const codecs = getCapabilities('video')?.codecs
  if (!codecs) {
    return []
  }

  return (
    codecs
      .filter((c) => {
        // mimeType は insensitive-case なので lowerCase に変換する
        const videoCodecType = c.mimeType.toLowerCase()

        // rtx/red/ulpfec はフィルターとして削除する
        if (
          videoCodecType === 'video/rtx' ||
          videoCodecType === 'video/red' ||
          videoCodecType === 'video/ulpfec'
        ) {
          return false
        }

        return true
      })
      // mimeType が既に存在している場合は重複を削除する
      .filter((c, index, self) => index === self.findIndex((t) => t.mimeType === c.mimeType))
      .map((c) => c.mimeType)
      .sort()
  )
}
