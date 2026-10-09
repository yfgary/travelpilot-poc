import { test, expect } from './fixtures'

test('the shared trip tabs remain sticky and new routes begin at the top', async ({ page }) => {
  await page.goto('#/trip/demo-road-trip/itinerary')
  const main = page.locator('main')
  const nav = page.getByRole('navigation', { name: '旅程頁面' })
  await expect(nav.getByRole('link', { name: '詳細行程' }).locator('svg')).toBeVisible()
  await main.evaluate((el) => { el.scrollTop = 850 })
  await expect.poll(async () => main.evaluate((el) => el.scrollTop)).toBeGreaterThan(320)
  const mainTop = (await main.boundingBox())!.y
  const navTop = (await nav.boundingBox())!.y
  // The scroll container deliberately retains its responsive top padding.
  // Verify sticky position is inside that top strip, not stranded in the hero.
  const padding = await main.evaluate((el) => parseFloat(getComputedStyle(el).paddingTop))
  expect(navTop - mainTop).toBeGreaterThanOrEqual(-1)
  expect(navTop - mainTop).toBeLessThanOrEqual(padding + 2)
  await nav.getByRole('link', { name: '旅程資料' }).click()
  await expect(page.getByRole('heading', { level: 1, name: '旅程資料' })).toBeVisible()
  await expect.poll(async () => main.evaluate((el) => el.scrollTop)).toBeLessThan(3)
})

test('Back-to-Top scrolls the main pane and metadata remains at the bottom', async ({ page }) => {
  await page.goto('#/trip/demo-road-trip/itinerary')
  const main = page.locator('main')
  const button = page.getByRole('button', { name: '返回頁頂' })
  await expect(button).toHaveCount(0)
  await main.evaluate((el) => { el.scrollTop = 950 })
  await expect(button).toBeVisible()
  await expect(page.locator('.trip-heading')).not.toContainText('Trip Data Version')
  await expect(page.locator('.trip-technical')).toContainText('Trip Data Version')
  await button.click()
  await expect.poll(async () => main.evaluate((el) => el.scrollTop)).toBeLessThan(3)
  await expect(button).toHaveCount(0)
})

test('the shared status uses green online and red offline icons', async ({ page, context }) => {
  await page.goto('#/')
  const dot = page.locator('.connection-dot')
  await expect(page.getByRole('status')).toContainText('ONLINE')
  await expect(dot).toHaveClass(/online/)
  await expect(dot).toHaveCSS('background-color', 'rgb(36, 150, 86)')
  await context.setOffline(true)
  await expect(page.getByRole('status')).toContainText('OFFLINE')
  await expect(dot).toHaveClass(/offline/)
  await expect(dot).toHaveCSS('background-color', 'rgb(213, 62, 64)')
  await context.setOffline(false)
  await expect(dot).toHaveClass(/online/)
})

test('denser checklist rows preserve at least 44px tap targets', async ({ page }) => {
  await page.goto('#/trip/demo-trip/info')
  const items = page.locator('.checklist-item')
  await expect(items.first()).toBeVisible()
  for (const item of await items.all()) {
    const box = await item.boundingBox()
    expect(box!.height).toBeGreaterThanOrEqual(44)
  }
})
