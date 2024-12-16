import Ayame from '@open-ayame/ayame-web-sdk'

document.addEventListener('DOMContentLoaded', () => {
  const signalingUrl = import.meta.env.VITE_AYAME_SIGNALING_URL
  const roomId = import.meta.env.VITE_AYAME_ROOM_ID
  const clientId = import.meta.env.VITE_AYAME_CLIENT_ID
  const signalingKey = import.meta.env.VITE_AYAME_SIGNALING_KEY

  // ここでコーデック一覧を取得する
  const videoCodecs = RTCRtpSender.getCapabilities('video')?.codecs
  if (!videoCodecs) {
    return
  }
  console.log(videoCodecs)

  // 映像コーデックを選択できるようにする
  const videoCodecsElement = document.getElementById('videoCodecs') as HTMLSelectElement
  if (!videoCodecsElement) {
    return
  }

  // mimeType でソートする
  videoCodecs.sort((a, b) => a.mimeType.localeCompare(b.mimeType))

  // div要素でコンテナを作成
  const container = document.createElement('div')
  container.style.display = 'flex'
  container.style.flexDirection = 'column'
  container.style.gap = '8px' // 項目間の間隔

  // クリアボタンを追加
  const clearButton = document.createElement('button')
  clearButton.textContent = 'すべてクリア'
  clearButton.style.alignSelf = 'flex-start' // コンテナの左側に配置
  clearButton.style.padding = '4px 8px' // 内側の余白を調整
  clearButton.style.width = 'fit-content' // コンテンツに合わせた幅に設定
  clearButton.addEventListener('click', () => {
    const checkboxes = container.querySelectorAll('input[type="checkbox"]')
    for (const checkbox of Array.from(checkboxes)) {
      ;(checkbox as HTMLInputElement).checked = false
    }
  })
  container.appendChild(clearButton)

  videoCodecsElement.appendChild(container)

  for (const codec of videoCodecs) {
    if (!['VP8', 'VP9', 'AV1', 'H264', 'H265'].includes(codec.mimeType.replace('video/', ''))) {
      continue
    }

    // 各項目用のdiv
    const itemDiv = document.createElement('div')

    const label = document.createElement('label')
    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.value = videoCodecs.indexOf(codec).toString()
    checkbox.name = 'videoCodecs'

    const span = document.createElement('span')
    const displayText = codec.sdpFmtpLine
      ? `${codec.mimeType} (${codec.sdpFmtpLine})`
      : codec.mimeType
    span.textContent = displayText

    label.appendChild(checkbox)
    label.appendChild(span)
    itemDiv.appendChild(label)
    container.appendChild(itemDiv)
  }

  videoCodecsElement.appendChild(container)

  let ayame: Ayame | null = null

  // connect ボタンを押す
  const connectButton = document.getElementById('connectButton')
  if (!connectButton) {
    return
  }
  connectButton.addEventListener('click', () => {
    // 選択されたコーデックリストを取得する
    const selectedVideoCodecs = Array.from(
      videoCodecsElement.querySelectorAll('input[name="videoCodecs"]:checked'),
    ).map((checkbox) => videoCodecs[Number.parseInt((checkbox as HTMLInputElement).value)])

    // 選択されたコーデックとプロファイルから RTCRtpCodecCapability を取得する
    // videoCodecs を利用する
    const matchingCodecs = videoCodecs.filter((codec) =>
      selectedVideoCodecs.some((selectedCodec) => selectedCodec.mimeType === codec.mimeType),
    )

    ayame = new Ayame({
      signalingUrl,
      roomId,
      clientId,
      signalingKey,
    })

    const pc = new RTCPeerConnection()
    for (const transceiver of pc.getTransceivers()) {
      // direction が sendonly または sendrecv の場合にする
      if (transceiver.direction === 'sendonly' || transceiver.direction === 'sendrecv') {
        // コーデックが存在しない場合は指定できいようにする
        if (!matchingCodecs.length) {
          return
        }
        transceiver.setCodecPreferences(matchingCodecs)
      }
    }

    console.log('connect')
  })

  // disconnect ボタンを押す
  const disconnectButton = document.getElementById('disconnectButton')
  if (!disconnectButton) {
    return
  }
  disconnectButton.addEventListener('click', () => {
    console.log('disconnect')
  })
})
