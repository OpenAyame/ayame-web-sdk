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

// 対応
export const getAvailableVideoCodecs = (): Array<any> => {
  if (typeof RTCRtpSender === 'undefined' || typeof RTCRtpSender.getCapabilities === 'function') {
    return []
  }

  const codecs = RTCRtpSender.getCapabilities('video')?.codecs
  if (!codecs) {
    return []
  }

  return (
    codecs
      .filter((c) => {
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
  )
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
