import { expect, test } from '@playwright/test'

test('DevTools', async ({ browser }) => {
  const sendrecv1 = await browser.newPage()
  const sendrecv2 = await browser.newPage()

  await sendrecv1.goto('http://localhost:9000/')
  await sendrecv2.goto('http://localhost:9000/')

  // RoodID を取得
  const roomId1 = await sendrecv1.evaluate(() => {
    const roomIdElement = document.getElementById('room-id') as HTMLInputElement
    return roomIdElement.value
  })
  const roomId2 = await sendrecv2.evaluate(() => {
    const roomIdElement = document.getElementById('room-id') as HTMLInputElement
    return roomIdElement.value
  })
  const roomIdSuffix = crypto.randomUUID()

  // RoomId を再設定
  await sendrecv1.fill('#room-id', `${roomId1}-${roomIdSuffix}`)
  await sendrecv2.fill('#room-id', `${roomId2}-${roomIdSuffix}`)

  // ボタンが表示されるまで待つ
  await sendrecv1.waitForSelector('#connect', { state: 'visible' })
  await sendrecv2.waitForSelector('#connect', { state: 'visible' })

  await sendrecv1.click('#connect')
  await sendrecv2.click('#connect')

  // data-connection-state が connected になるまで待つ
  await expect(sendrecv1.locator('#connection-state')).toHaveAttribute(
    'data-connection-state',
    'connected',
    { timeout: 10000 },
  )

  // もう一方のページも connected になるまで待つ
  await expect(sendrecv2.locator('#connection-state')).toHaveAttribute(
    'data-connection-state',
    'connected',
    { timeout: 10000 },
  )

  await sendrecv1.click('#disconnect')
  await sendrecv2.click('#disconnect')

  await sendrecv1.close()
  await sendrecv2.close()
})
