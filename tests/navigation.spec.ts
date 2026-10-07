import { test, expect } from './fixtures'

test('shared Back has a prominent circular touch target and distinct interaction states', async ({ page }) => {
  await page.goto('#/settings')
  const back = page.getByRole('button', { name: '返回上一頁' })
  await expect(page.locator('.app-header').getByRole('button', { name: '返回上一頁' })).toBeVisible()
  await expect(back).toHaveCSS('width', '44px')
  await expect(back).toHaveCSS('height', '44px')
  await expect(back).toHaveCSS('border-radius', '50%')
  await expect(back).toHaveCSS('background-color', 'rgb(8, 121, 209)')
  await expect(back.locator('svg')).toHaveCSS('stroke', 'rgb(255, 255, 255)')
  await back.hover()
  await expect(back).toHaveCSS('background-color', 'rgb(8, 101, 173)')
  await back.focus()
  await page.keyboard.press('Tab')
  await page.keyboard.press('Shift+Tab')
  await expect(back).toBeFocused()
  await expect(back).toHaveCSS('outline-style', 'solid')
  await expect(back).toHaveCSS('outline-width', '3px')
  await page.mouse.down()
  await expect(back).toHaveCSS('background-color', 'rgb(9, 46, 114)')
  await page.mouse.move(0, 0)
  await page.mouse.up()
  await expect(page).toHaveURL(/#\/settings$/)
})

for (const view of ['itinerary', 'info']) {
  test(`shared Back restores exact ${view} from Settings and after reload`, async ({ page }) => {
    await page.goto(`#/trip/demo-trip/${view}`)
    await page.getByRole('navigation', { name: '主導覽' }).getByRole('link', { name: '設定' }).click()
    await page.reload()
    await page.getByRole('button', { name: '返回上一頁' }).click()
    await expect(page).toHaveURL(new RegExp(`#/trip/demo-trip/${view}$`))
  })
}
test('Back restores most recent trip page, then earlier page', async ({ page }) => {
  await page.goto('#/trip/demo-trip/itinerary')
  await page.getByRole('navigation', { name: '旅程頁面' }).getByRole('link', { name: '旅程資料' }).click()
  await page.getByRole('navigation', { name: '主導覽' }).getByRole('link', { name: '設定' }).click()
  await page.getByRole('button', { name: '返回上一頁' }).click()
  await expect(page).toHaveURL(/#\/trip\/demo-trip\/info$/)
  await page.getByRole('button', { name: '返回上一頁' }).click()
  await expect(page).toHaveURL(/#\/trip\/demo-trip\/itinerary$/)
})
for (const route of ['#/settings', '#/trip/demo-trip/info']) {
  test(`direct ${route} Back stays inside app even with external history`, async ({ page }) => {
    await page.route('https://example.invalid/**', (route) => route.fulfill({ contentType: 'text/html', body: '<p>External page</p>' }))
    await page.goto('https://example.invalid/')
    await page.goto(route)
    await page.getByRole('button', { name: '返回上一頁' }).click()
    await expect(page).toHaveURL(/\/travelpilot-poc\/#\/$/)
    await expect(page.getByRole('button', { name: '返回上一頁' })).toHaveCount(0)
  })
}
test('Home has no Back button and blocked storage still supports safe navigation', async ({ page }) => {
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new Error('Blocked') } })
  await page.goto('#/')
  await expect(page.getByRole('button', { name: '返回上一頁' })).toHaveCount(0)
  await page.getByRole('link', { name: '開啟旅程' }).click()
  await page.getByRole('button', { name: '返回上一頁' }).click()
  await expect(page).toHaveURL(/#\/$/)
})

test('fresh direct Settings reload Back falls back Home', async ({ page }) => {
  await page.goto('#/settings')
  await page.reload()
  await page.getByRole('button', { name: '返回上一頁' }).click()
  await expect(page).toHaveURL(/\/travelpilot-poc\/#\/$/)
})

test('reload persists a safe pending router entry before React commits the new view', async ({ page }) => {
  await page.goto('#/trip/demo-trip/info')
  await expect(page.getByRole('heading', { name: '旅程資料', exact: true })).toBeVisible()
  // Reproduce the router URL commit occurring before its React transition.
  await page.evaluate(() => history.pushState({ ...history.state, key: 'pending-settings', idx: (history.state.idx ?? 0) + 1 }, '', '#/settings'))
  await page.reload()
  await expect(page.getByRole('heading', { name: '設定', exact: true })).toBeVisible()
  await page.getByRole('button', { name: '返回上一頁' }).click()
  await expect(page).toHaveURL(/#\/trip\/demo-trip\/info$/)
})
