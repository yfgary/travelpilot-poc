import { test, expect } from './fixtures'

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
