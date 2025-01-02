import { expect, test } from '@playwright/test'

test('sendrecv x2', async ({ browser }) => {
  const sendrecv1 = await browser.newPage()
  const sendrecv2 = await browser.newPage()

  await sendrecv1.goto('http://localhost:9000/')
  await sendrecv2.goto('http://localhost:9000/')

  // チャンネル名を設定
  await sendrecv1.fill('#channel-name', 'sendrecv-different-video-codec-type')
  await sendrecv2.fill('#channel-name', 'sendrecv-different-video-codec-type')

  console.log('sendrecv1 channelName: sendrecv-different-video-codec-type')
  console.log('sendrecv2 channelName: sendrecv-different-video-codec-type')

  await sendrecv1.click('#connect')
  await sendrecv2.click('#connect')

  await sendrecv1.click('#disconnect')
  await sendrecv2.click('#disconnect')

  await sendrecv1.close()
  await sendrecv2.close()
})
