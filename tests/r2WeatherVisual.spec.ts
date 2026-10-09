import { test, expect } from './fixtures'
import { openMeteoResponse } from './weatherFixtures'
import { openToday } from './todayFixtures'

test('five forecast days use desktop width while small screens retain horizontal scrolling', async ({ page }) => {
  await page.route('https://api.open-meteo.com/**', (route) => route.fulfill({ json: openMeteoResponse('2025-02-05') }))
  await page.goto('#/trip/demo-road-trip/info')
  const forecast = page.getByRole('region', { name: '未來5日預測，可橫向捲動' })
  const days = forecast.locator('.weather-forecast-day')
  await expect(days).toHaveCount(5)
  const dims = await forecast.evaluate((el) => ({
    client: el.clientWidth,
    scroll: el.scrollWidth,
    ys: [...el.children].map((child) => Math.round(child.getBoundingClientRect().top)),
  }))
  expect(new Set(dims.ys).size).toBe(1)
  if (page.viewportSize()!.width >= 900) expect(dims.scroll).toBeLessThanOrEqual(dims.client + 2)
  else expect(dims.scroll).toBeGreaterThan(dims.client)
  expect(await page.locator('main').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
  const rows = days.first().locator('.weather-daily-metrics > div')
  await expect(rows).toHaveCount(10)
  await expect(rows.first()).toHaveCSS('display', 'grid')
})

test('semantic score band changes numeric score color without changing scoring rules', async ({ page }) => {
  await page.route('https://api.open-meteo.com/**', (route) => route.fulfill({ json: openMeteoResponse('2025-02-05') }))
  await page.goto('#/trip/demo-road-trip/info')
  const score = page.getByTestId('weather-panel').locator('.weather-score').first()
  await expect(score).toBeVisible()
  const band = await score.getAttribute('data-score-state') as 'good' | 'fair' | 'poor'
  expect(['good', 'fair', 'poor']).toContain(band)
  const colors = { good: 'rgb(31, 113, 65)', fair: 'rgb(137, 92, 15)', poor: 'rgb(163, 53, 43)' }
  await expect(score.locator('.weather-score-main')).toHaveCSS('color', colors[band])
})

test('Today navigation groups primary stop and parking details into one compact card', async ({ page }) => {
  await openToday(page)
  const primary = page.getByRole('region', { name: '主要導航目的地' })
  await expect(primary).toBeVisible()
  await expect(primary.locator('.today-navigation')).toContainText('泊車／入口等導航補充')
  await expect(page.locator('.today-operational-grid > .today-navigation')).toHaveCount(0)
  await expect(primary.getByRole('link', { name: /Google Maps：主要目的地/ })).toBeVisible()
})
