import { version } from '@open-ayame/ayame-web-sdk'
import { expect, test } from '@playwright/test'

test('Ayame Web SDK のバージョンを確認', async ({ browser }) => {
  const sendrecv1 = await browser.newPage()

  await sendrecv1.goto('http://localhost:9000/')

  // Ayame Web SDK のバージョンを確認
  await expect(sendrecv1.locator('[data-testid="ayame-web-sdk-version"]')).toHaveText(version(), {
    timeout: 10000,
  })

  await sendrecv1.close()
})
