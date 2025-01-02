import { createConnection, defaultOptions, getAvailableCodecs } from '@open-ayame/ayame-web-sdk'
import type {
  AyameAddStreamEvent,
  Connection,
  ConnectionOptions,
  Direction,
} from '@open-ayame/ayame-web-sdk'
import queryString from 'query-string'

document.addEventListener('DOMContentLoaded', async () => {
  // <permission> を利用した microphone/camera の権限取得
  // https://developer.chrome.com/blog/permission-element-origin-trial?hl=ja
  if ('HTMLPermissionElement' in window) {
    // @ts-ignore HTMLPermissionElement を認識しないため
    const permission = document.createElement('permission') as HTMLPermissionElement
    permission.type = 'microphone camera'
    // <permission type="microphone camera"> を作って追加する
    const permissionContainer = document.getElementById('permission-container')
    if (permissionContainer) {
      permissionContainer.appendChild(permission)
    }
  } else {
    // <permission> が非対応な場合はただボタンを作る
    const permission = document.createElement('button')
    permission.id = 'request-media-permission'
    permission.textContent = 'Request Media Permission'
    const permissionContainer = document.getElementById('permission-container')
    if (permissionContainer) {
      permissionContainer.appendChild(permission)
    }
  }

  let signalingUrl = import.meta.env.VITE_AYAME_SIGNALING_URL
  let roomIdPrefix = import.meta.env.VITE_AYAME_ROOM_ID_PREFIX
  let roomName = import.meta.env.VITE_AYAME_ROOM_NAME
  let signalingKey = import.meta.env.VITE_AYAME_SIGNALING_KEY

  const queryParams = queryString.parse(location.search)

  // もし qs があれば適用していく
  if (queryParams.signalingUrl && typeof queryParams.signalingUrl === 'string') {
    signalingUrl = queryParams.signalingUrl as string
  }
  if (queryParams.roomIdPrefix && typeof queryParams.roomIdPrefix === 'string') {
    roomIdPrefix = queryParams.roomIdPrefix as string
  }
  if (queryParams.roomName && typeof queryParams.roomName === 'string') {
    roomName = queryParams.roomName as string
  }

  if (queryParams.signalingKey && typeof queryParams.signalingKey === 'string') {
    signalingKey = queryParams.signalingKey as string
  }

  // コネクション関連の設定をする
  setSignalingUrl(signalingUrl)
  setRoomId(roomIdPrefix, roomName)
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

  // <permission> が非対応な場合は getUserMedia を利用して microphone/camera の権限取得を行う
  document.querySelector('#request-media-permission')?.addEventListener('click', async () => {
    const audioPermission = await navigator.permissions.query({
      name: 'microphone' as PermissionName,
    })
    if (audioPermission.state === 'granted') {
      return
    }
    // microphone/camera は NodeJS ではまだ非対応
    // https://github.com/microsoft/TypeScript-DOM-lib-generator/issues/1129
    const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName })
    if (cameraPermission.state === 'granted') {
      return
    }

    // 権限取得して
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    })
    // デバイス一覧も取得して
    await navigator.mediaDevices.enumerateDevices()
    // トラック停止する
    for (const track of stream.getTracks()) {
      track.stop()
    }
  })

  // qs の audio の値があれば適用する
  if (queryParams.audio && typeof queryParams.audio === 'string') {
    setAudioEnabled(queryParams.audio === 'true')
  }

  // 音声デバイスの権限の状態を取得する
  const audioPermission = await navigator.permissions.query({
    name: 'microphone' as PermissionName,
  })
  audioPermission.onchange = async (event: Event) => {
    const permissionStatus = event.target as PermissionStatus
    console.debug('audioPermissionStatus', permissionStatus)
    const audioPermissionStateElement = document.getElementById(
      'audio-device-permission-state',
    ) as HTMLSpanElement
    if (!audioPermissionStateElement) {
      return
    }
    audioPermissionStateElement.textContent = permissionStatus.state
    // パーミッションが granted だった場合は音声デバイス一覧を取得する
    if (permissionStatus.state === 'granted') {
      // 音声入力デバイス一覧の取得
      const audioInputDeviceElement = document.getElementById(
        'audio-input-device',
      ) as HTMLSelectElement
      if (!audioInputDeviceElement) {
        return
      }
      const audioInputDevices = await navigator.mediaDevices.enumerateDevices()
      for (const device of audioInputDevices) {
        if (device.kind === 'audioinput') {
          const option = document.createElement('option')
          option.value = device.deviceId
          option.textContent = device.label
          audioInputDeviceElement.appendChild(option)
        }
      }

      // 音声出力デバイス一覧の取得
      const audioOutputDeviceElement = document.getElementById(
        'audio-output-device',
      ) as HTMLSelectElement
      if (!audioOutputDeviceElement) {
        return
      }
      const audioOutputDevices = await navigator.mediaDevices.enumerateDevices()
      for (const device of audioOutputDevices) {
        if (device.kind === 'audiooutput') {
          const option = document.createElement('option')
          option.value = device.deviceId
          option.textContent = device.label
          audioOutputDeviceElement.appendChild(option)
        }
      }
    } else if (permissionStatus.state === 'prompt' || permissionStatus.state === 'denied') {
      // パーミッションが prompt だった場合は音声デバイス一覧クリアにして選択できないようにする
      const audioInputDeviceElement = document.getElementById(
        'audio-input-device',
      ) as HTMLSelectElement
      if (!audioInputDeviceElement) {
        return
      }
      audioInputDeviceElement.innerHTML = ''
      const audioOutputDeviceElement = document.getElementById(
        'audio-output-device',
      ) as HTMLSelectElement
      if (!audioOutputDeviceElement) {
        return
      }
      audioOutputDeviceElement.innerHTML = ''
    }
  }

  const audioPermissionStateElement = document.getElementById(
    'audio-device-permission-state',
  ) as HTMLSpanElement
  if (!audioPermissionStateElement) {
    return
  }
  audioPermissionStateElement.textContent = audioPermission.state
  // パーミッションが granted だった場合は音声デバイス一覧を取得する
  if (audioPermission.state === 'granted') {
    // 音声入力デバイス一覧の取得
    const audioInputDeviceElement = document.getElementById(
      'audio-input-device',
    ) as HTMLSelectElement
    if (!audioInputDeviceElement) {
      return
    }
    const audioInputDevices = await navigator.mediaDevices.enumerateDevices()
    for (const device of audioInputDevices) {
      if (device.kind === 'audioinput') {
        const option = document.createElement('option')
        option.value = device.deviceId
        option.textContent = device.label
        audioInputDeviceElement.appendChild(option)
      }
    }

    // 音声出力デバイス一覧の取得
    const audioOutputDeviceElement = document.getElementById(
      'audio-output-device',
    ) as HTMLSelectElement
    if (!audioOutputDeviceElement) {
      return
    }
    const audioOutputDevices = await navigator.mediaDevices.enumerateDevices()
    for (const device of audioOutputDevices) {
      if (device.kind === 'audiooutput') {
        const option = document.createElement('option')
        option.value = device.deviceId
        option.textContent = device.label
        audioOutputDeviceElement.appendChild(option)
      }
    }
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

  // 映像デバイスの権限の状態を取得する
  const videoPermission = await navigator.permissions.query({
    name: 'camera' as PermissionName,
  })
  videoPermission.onchange = async (event: Event) => {
    const permissionStatus = event.target as PermissionStatus
    console.debug('videoPermissionStatus', permissionStatus)
    const videoPermissionStateElement = document.getElementById(
      'video-device-permission-state',
    ) as HTMLSpanElement
    if (!videoPermissionStateElement) {
      return
    }
    videoPermissionStateElement.textContent = permissionStatus.state
    if (permissionStatus.state === 'granted') {
      // 映像入力デバイス一覧の取得
      const videoInputDeviceElement = document.getElementById(
        'video-input-device',
      ) as HTMLSelectElement
      if (!videoInputDeviceElement) {
        return
      }
      const videoInputDevices = await navigator.mediaDevices.enumerateDevices()
      for (const device of videoInputDevices) {
        if (device.kind === 'videoinput') {
          const option = document.createElement('option')
          option.value = device.deviceId
          option.textContent = device.label
          videoInputDeviceElement.appendChild(option)
        }
      }
    } else if (permissionStatus.state === 'prompt' || permissionStatus.state === 'denied') {
      // 映像入力デバイス一覧クリアにして選択できないようにする
      const videoInputDeviceElement = document.getElementById(
        'video-input-device',
      ) as HTMLSelectElement
      if (!videoInputDeviceElement) {
        return
      }
      videoInputDeviceElement.innerHTML = ''
    }
  }
  const videoPermissionStateElement = document.getElementById(
    'video-device-permission-state',
  ) as HTMLSpanElement
  if (!videoPermissionStateElement) {
    return
  }
  videoPermissionStateElement.textContent = videoPermission.state

  // 映像入力デバイス一覧の取得
  const videoInputDeviceElement = document.getElementById('video-input-device') as HTMLSelectElement
  if (!videoInputDeviceElement) {
    return
  }
  const videoInputDevices = await navigator.mediaDevices.enumerateDevices()
  for (const device of videoInputDevices) {
    if (device.kind === 'videoinput') {
      const option = document.createElement('option')
      option.value = device.deviceId
      option.textContent = device.label
      videoInputDeviceElement.appendChild(option)
    }
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

  let stream: MediaStream | null = null
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

    conn.on('addstream', (event: AyameAddStreamEvent) => {
      const remoteVideo = document.getElementById('remote-video') as HTMLVideoElement
      if (!remoteVideo) {
        return
      }
      console.debug('addstream', event)
      remoteVideo.srcObject = event.stream
    })

    conn.on('open', () => {
      if (!conn) {
        return
      }
      const pc = conn.peerConnection
      if (!pc) {
        return
      }
      pc.onconnectionstatechange = (event: Event) => {
        const connectionStateElement = document.getElementById(
          'connection-state',
        ) as HTMLSpanElement
        if (!connectionStateElement) {
          return
        }
        // data-connection-state の値を更新する
        connectionStateElement.dataset.connectionState = pc.connectionState
      }
    })

    conn.on('disconnect', () => {
      if (!conn) {
        return
      }
      if (stream) {
        for (const track of stream.getTracks()) {
          track.stop()
        }
        const localVideo = document.getElementById('local-video') as HTMLVideoElement
        if (localVideo) {
          localVideo.srcObject = null
        }
      }
      const remoteVideo = document.getElementById('remote-video') as HTMLVideoElement
      if (remoteVideo) {
        remoteVideo.srcObject = null
      }
      stream = null
      conn = null
      console.debug('disconnect')
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

    if (stream) {
      for (const track of stream.getTracks()) {
        track.stop()
      }
      const localVideo = document.getElementById('local-video') as HTMLVideoElement
      if (localVideo) {
        localVideo.srcObject = null
      }
      stream = null
    }

    const remoteVideo = document.getElementById('remote-video') as HTMLVideoElement
    if (remoteVideo) {
      remoteVideo.srcObject = null
    }

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

const setRoomId = (roomIdPrefix: string, roomName: string): void => {
  const roomIdElement = document.getElementById('room-id') as HTMLInputElement
  if (!roomIdElement) {
    return
  }
  roomIdElement.value = `${roomIdPrefix}${roomName}`
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
