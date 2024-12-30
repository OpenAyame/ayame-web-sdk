import { createConnection, defaultOptions, getAvailableCodecs } from '@open-ayame/ayame-web-sdk'
import type { Connection, ConnectionOptions, Direction } from '@open-ayame/ayame-web-sdk'
import queryString from 'query-string'

document.addEventListener('DOMContentLoaded', () => {
  let signalingUrl = import.meta.env.VITE_AYAME_SIGNALING_URL
  let roomId = import.meta.env.VITE_AYAME_ROOM_ID
  let signalingKey = import.meta.env.VITE_AYAME_SIGNALING_KEY

  const queryParams = queryString.parse(location.search)

  // もし qs があれば適用していく
  if (queryParams.signalingUrl && typeof queryParams.signalingUrl === 'string') {
    signalingUrl = queryParams.signalingUrl as string
  }
  if (queryParams.roomId && typeof queryParams.roomId === 'string') {
    roomId = queryParams.roomId as string
  }
  if (queryParams.signalingKey && typeof queryParams.signalingKey === 'string') {
    signalingKey = queryParams.signalingKey as string
  }

  // コネクション関連の設定をする
  setSignalingUrl(signalingUrl)
  setRoomId(roomId)
  setClientId(crypto.randomUUID())
  setSignalingKey(signalingKey)

  // qs の standalone の値があれば適用する
  if (queryParams.standalone && typeof queryParams.standalone === 'string') {
    setStandalone(queryParams.standalone === 'true')
  }

  // qs の debug の値があれば適用する
  if (queryParams.debug && typeof queryParams.debug === 'string') {
    setDebug(queryParams.debug === 'true')
  }

  // qs の audio の値があれば適用する
  if (queryParams.audio && typeof queryParams.audio === 'string') {
    setAudioEnabled(queryParams.audio === 'true')
  }

  // qs の audioDirection の値があれば適用する
  if (queryParams.audioDirection && typeof queryParams.audioDirection === 'string') {
    setAudioDirection(queryParams.audioDirection as Direction)
  }
  const audioDirection = getAudioDirection()

  const audioCodecMimeTypeElement = document.getElementById(
    'audio-codec-mime-type',
  ) as HTMLSelectElement
  if (!audioCodecMimeTypeElement) {
    return
  }

  const availableAudioCodecs = getAvailableCodecs('audio', senderOrReceiver(audioDirection))
  for (const codec of availableAudioCodecs) {
    const option = document.createElement('option')
    option.value = codec
    option.textContent = codec
    audioCodecMimeTypeElement.appendChild(option)
  }

  const audioCodecMimeType = queryParams.audioCodecMimeType
  if (audioCodecMimeType && typeof audioCodecMimeType === 'string') {
    const audioCodecMimeTypeElement = document.getElementById(
      'audio-codec-mime-type',
    ) as HTMLSelectElement
    if (!audioCodecMimeTypeElement) {
      return
    }
    // セレクトボックスの値に audioCodecMimeType の値があったら反映する
    const option = audioCodecMimeTypeElement.querySelector(
      `option[value="${audioCodecMimeType}"]`,
    ) as HTMLOptionElement
    if (option) {
      option.selected = true
    }
  }

  if (queryParams.video && typeof queryParams.video === 'string') {
    setVideoEnabled(queryParams.video === 'true')
  }

  if (queryParams.videoDirection && typeof queryParams.videoDirection === 'string') {
    setVideoDirection(queryParams.videoDirection as Direction)
  }
  const videoDirection = getVideoDirection()

  const videoCodecMimeTypeElement = document.getElementById(
    'video-codec-mime-type',
  ) as HTMLSelectElement
  if (!videoCodecMimeTypeElement) {
    return
  }

  // getAvailableVideoCodecs で取得したコーデックをセレクトボックスに設定する
  // 送受信なので Direction.Sendrecv を渡す
  const availableVideoCodecs = getAvailableCodecs('video', senderOrReceiver(videoDirection))
  for (const codec of availableVideoCodecs) {
    const option = document.createElement('option')
    option.value = codec
    option.textContent = codec
    videoCodecMimeTypeElement.appendChild(option)
  }

  // qs の videoCodecMimeType の値が select の value でマッチするモノがあったら切り替える
  const videoCodecMimeType = queryParams.videoCodecMimeType
  if (videoCodecMimeType && typeof videoCodecMimeType === 'string') {
    const videoCodecMimeTypeElement = document.getElementById(
      'video-codec-mime-type',
    ) as HTMLSelectElement
    if (!videoCodecMimeTypeElement) {
      return
    }
    // セレクトボックスの値に videoCodecMimeType の値があったら反映する
    const option = videoCodecMimeTypeElement.querySelector(
      `option[value="${videoCodecMimeType}"]`,
    ) as HTMLOptionElement
    if (option) {
      option.selected = true
    }
  }

  let conn: Connection | null = null

  // connect ボタンを押す
  document.querySelector('#connect')?.addEventListener('click', async () => {
    const options: ConnectionOptions = defaultOptions
    if (signalingKey) {
      options.audio.enabled = getAudioEnabled()
      options.audio.direction = getAudioDirection()
      options.audio.codecMimeType = getAudioCodecMimeType()
      options.video.enabled = getVideoEnabled()
      options.video.direction = getVideoDirection()
      options.video.codecMimeType = getVideoCodecMimeType()
      options.standalone = getStandalone()
      options.clientId = getClientId()
      options.signalingKey = getSignalingKey()
    }

    const signalingUrl = getSignalingUrl()
    const roomId = getRoomId()
    const debug = getDebug()

    // createConnection に変更する
    conn = createConnection(signalingUrl, roomId, options, debug)

    let stream: MediaStream | null = null

    // audio が有効かつ sendrecv または sendonly の場合はローカルの音声を取得する
    const audioEnabled =
      options.audio.enabled &&
      (options.audio.direction === 'sendrecv' || options.audio.direction === 'sendonly')
    // video が有効かつ sendrecv または sendonly の場合はローカルの映像を取得する
    const videoEnabled =
      options.video.enabled &&
      (options.video.direction === 'sendrecv' || options.video.direction === 'sendonly')

    if (audioEnabled || videoEnabled) {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: audioEnabled,
        video: videoEnabled,
      })
    }

    // stream が取得できたら local-video に設定する
    if (stream) {
      const localVideo = document.getElementById('local-video') as HTMLVideoElement
      if (!localVideo) {
        return
      }
      localVideo.srcObject = stream
    }

    conn.on('addstream', (event) => {
      const remoteVideo = document.getElementById('remote-video') as HTMLVideoElement
      if (!remoteVideo) {
        return
      }
      console.debug('addstream', event)
      remoteVideo.srcObject = event.stream
    })

    conn.on('removestream', (event) => {
      const remoteVideo = document.getElementById('remote-video') as HTMLVideoElement
      if (!remoteVideo) {
        return
      }
      console.debug('removestream', event)
      remoteVideo.srcObject = null
    })

    await conn.connect(stream)
  })

  document.querySelector('#disconnect')?.addEventListener('click', async () => {
    if (!conn) {
      return
    }
    console.debug('disconnecting...')
    await conn.disconnect()
    console.debug('disconnected')
    conn = null
  })

  // コピーURLボタンのイベントリスナーを追加
  document.querySelector('#copy-url')?.addEventListener('click', async () => {
    const queryParams = getSettingsAsQueryParams()
    // URLを更新
    window.history.replaceState(null, '', `?${queryParams}`)
    // 更新されたURLをコピー
    const url = window.location.href

    try {
      await navigator.clipboard.writeText(url)
      console.log('Copied to clipboard')
    } catch (err) {
      console.error('Failed to copy URL:', err)
    }
  })
})

// 設定をクエリパラメータとして取得する関数を追加
const getSettingsAsQueryParams = () => {
  const params: Record<string, string | boolean> = {
    signalingUrl: getSignalingUrl(),
    roomId: getRoomId(),
    signalingKey: getSignalingKey(),
    standalone: getStandalone(),
    debug: getDebug(),
    audio: getAudioEnabled(),
    audioDirection: getAudioDirection(),
    audioCodecMimeType: getAudioCodecMimeType() || '',
    video: getVideoEnabled(),
    videoDirection: getVideoDirection(),
    videoCodecMimeType: getVideoCodecMimeType() || '',
  }

  // undefinedの値を除外
  for (const key in params) {
    if (params[key] === undefined) {
      delete params[key]
    }
  }

  return queryString.stringify(params)
}

const senderOrReceiver = (direction: Direction) => {
  switch (direction) {
    case 'sendrecv':
      return 'sender'
    case 'sendonly':
      return 'sender'
    case 'recvonly':
      return 'receiver'
    default:
      throw new Error(`Invalid direction: ${direction}`)
  }
}

const getSignalingUrl = (): string => {
  const signalingUrlElement = document.getElementById('signaling-url') as HTMLInputElement
  if (!signalingUrlElement) {
    return ''
  }
  return signalingUrlElement.value
}

const setSignalingUrl = (signalingUrl: string): void => {
  const signalingUrlElement = document.getElementById('signaling-url') as HTMLInputElement
  if (!signalingUrlElement) {
    return
  }
  signalingUrlElement.value = signalingUrl
}

const getRoomId = (): string => {
  const roomIdElement = document.getElementById('room-id') as HTMLInputElement
  if (!roomIdElement) {
    return ''
  }
  return roomIdElement.value
}

const setRoomId = (roomId: string): void => {
  const roomIdElement = document.getElementById('room-id') as HTMLInputElement
  if (!roomIdElement) {
    return
  }
  roomIdElement.value = roomId
}

const getClientId = () => {
  const clientIdElement = document.getElementById('client-id') as HTMLInputElement
  if (!clientIdElement) {
    return ''
  }
  return clientIdElement.value
}

const setClientId = (clientId: string): void => {
  const clientIdElement = document.getElementById('client-id') as HTMLInputElement
  if (!clientIdElement) {
    return
  }
  clientIdElement.value = clientId
}

const getSignalingKey = (): string => {
  const signalingKeyElement = document.getElementById('signaling-key') as HTMLInputElement
  if (!signalingKeyElement) {
    return ''
  }
  return signalingKeyElement.value
}

const setSignalingKey = (signalingKey: string): void => {
  const signalingKeyElement = document.getElementById('signaling-key') as HTMLInputElement
  if (!signalingKeyElement) {
    return
  }
  signalingKeyElement.value = signalingKey
}

const getStandalone = () => {
  const standaloneElement = document.getElementById('standalone') as HTMLInputElement
  if (!standaloneElement) {
    return false
  }
  return standaloneElement.checked
}

const setStandalone = (standalone: boolean): void => {
  const standaloneElement = document.getElementById('standalone') as HTMLInputElement
  if (!standaloneElement) {
    return
  }
  standaloneElement.checked = standalone
}

const getDebug = () => {
  const debugElement = document.getElementById('debug') as HTMLInputElement
  if (!debugElement) {
    return false
  }
  return debugElement.checked
}

const setDebug = (debug: boolean): void => {
  const debugElement = document.getElementById('debug') as HTMLInputElement
  if (!debugElement) {
    return
  }
  debugElement.checked = debug
}

const getAudioEnabled = () => {
  const audioElement = document.getElementById('audio') as HTMLInputElement
  if (!audioElement) {
    return false
  }
  return audioElement.checked
}

const setAudioEnabled = (audioEnabled: boolean): void => {
  const audioElement = document.getElementById('audio') as HTMLInputElement
  if (!audioElement) {
    return
  }
  audioElement.checked = audioEnabled
}

const getAudioDirection = (): Direction => {
  const audioDirectionElement = document.getElementById('audio-direction') as HTMLSelectElement
  if (!audioDirectionElement) {
    return 'sendrecv'
  }
  return audioDirectionElement.value as Direction
}

const setAudioDirection = (audioDirection: Direction): void => {
  const audioDirectionElement = document.getElementById('audio-direction') as HTMLSelectElement
  if (!audioDirectionElement) {
    return
  }
  audioDirectionElement.value = audioDirection
}

const getAudioCodecMimeType = () => {
  const audioCodecMimeTypeElement = document.getElementById(
    'audio-codec-mime-type',
  ) as HTMLSelectElement
  if (!audioCodecMimeTypeElement) {
    return undefined
  }
  return audioCodecMimeTypeElement.value
}

const setAudioCodecMimeType = (audioCodecMimeType: string): void => {
  const audioCodecMimeTypeElement = document.getElementById(
    'audio-codec-mime-type',
  ) as HTMLSelectElement
  if (!audioCodecMimeTypeElement) {
    return
  }
  audioCodecMimeTypeElement.value = audioCodecMimeType
}

const getVideoEnabled = () => {
  const videoElement = document.getElementById('video') as HTMLInputElement
  if (!videoElement) {
    return false
  }
  return videoElement.checked
}

const setVideoEnabled = (videoEnabled: boolean): void => {
  const videoElement = document.getElementById('video') as HTMLInputElement
  if (!videoElement) {
    return
  }
  videoElement.checked = videoEnabled
}

const getVideoDirection = (): Direction => {
  const videoDirectionElement = document.getElementById('video-direction') as HTMLSelectElement
  if (!videoDirectionElement) {
    return 'sendrecv'
  }
  return videoDirectionElement.value as Direction
}

const setVideoDirection = (videoDirection: Direction): void => {
  const videoDirectionElement = document.getElementById('video-direction') as HTMLSelectElement
  if (!videoDirectionElement) {
    return
  }
  videoDirectionElement.value = videoDirection
}

const getVideoCodecMimeType = (): string | undefined => {
  const videoCodecMimeTypeElement = document.getElementById(
    'video-codec-mime-type',
  ) as HTMLSelectElement
  if (!videoCodecMimeTypeElement) {
    return undefined
  }
  return videoCodecMimeTypeElement.value
}

const setVideoCodecMimeType = (videoCodecMimeType: string): void => {
  const videoCodecMimeTypeElement = document.getElementById(
    'video-codec-mime-type',
  ) as HTMLSelectElement
  if (!videoCodecMimeTypeElement) {
    return
  }
  videoCodecMimeTypeElement.value = videoCodecMimeType
}
