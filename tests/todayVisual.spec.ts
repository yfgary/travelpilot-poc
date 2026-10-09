import { mkdirSync } from 'node:fs'
import { test, expect } from './fixtures'
import { openMeteoResponse } from './weatherFixtures'

test('responsive Today visual scenarios include city preview, road operational state and end-of-day', async ({ page }, info) => {
  const width = page.viewportSize()!.width
  await page.addInitScript((width) => localStorage.setItem('travelpilot.font-size', width === 320 ? 'large' : 'medium'), width)
  await page.route('https://api.open-meteo.com/**', (route) => route.fulfill({ json: openMeteoResponse('2025-02-06') }))
  await page.clock.install({ time: new Date('2025-02-06T09:15:00Z') })
  for (const [scene, slug, time] of [['city-preview', 'demo-trip', '2025-02-06T09:15:00Z'], ['road-actual', 'demo-road-trip', '2025-02-06T09:15:00Z'], ['road-end', 'demo-road-trip', '2025-02-06T19:00:00Z']] as const) {
    await page.clock.setFixedTime(new Date(time)); await page.goto(`#/trip/${slug}/today`)
    await expect(page.getByTestId('today-mode')).toBeVisible()
    const todayWeather = page.getByTestId('today-weather')
    if (scene === 'city-preview') {
      // The planned day is outside the real five-day horizon: show test-only weather, not a fake trip-date forecast.
      await expect(todayWeather.getByTestId('today-weather-simulation')).toContainText('POC 模擬天氣（畫面測試）')
      await expect(todayWeather.getByTestId('today-weather-simulation')).toContainText('並非該行程日期的預測')
      await expect(todayWeather).toContainText('現時天氣樣本')
      await expect(todayWeather.locator('.today-weather-main')).toBeVisible()
      await expect(todayWeather.locator('.today-weather-metrics')).toBeVisible()
      await expect(todayWeather.locator('.weather-score')).toBeVisible()
      await expect(todayWeather.getByTestId('today-weather-outside')).toHaveCount(0)
    } else {
      // Matching-day real weather must never be mislabeled as a simulated forecast.
      await expect(todayWeather.locator('.today-weather-main')).toBeVisible()
      await expect(todayWeather.getByTestId('today-weather-simulation')).toHaveCount(0)
    }
    await expect(page.locator('.today-mode-label')).toHaveText(scene === 'city-preview' ? '預覽模式' : '今日 · 按時間自動')
    if (scene === 'road-end') await expect(page.locator('.today-end')).toHaveText('今日主要行程已到最後一項')
    expect(await page.evaluate(() => document.body.scrollWidth <= innerWidth && document.querySelector('main')!.scrollWidth <= document.querySelector('main')!.clientWidth)).toBe(true)
    await expect(page.getByRole('status')).toBeVisible()
    if (process.env.TP_VISUAL_QA === '1') {
      mkdirSync('work/step14/visual', { recursive: true })
      const main = page.locator('.content-shell'), size = await main.evaluate((node) => ({ height: node.clientHeight, total: node.scrollHeight }))
      const max = Math.max(0, size.total - size.height), points = Array.from({ length: Math.ceil(max / (size.height * .8)) + 1 }, (_, i) => Math.min(max, i * size.height * .8))
      for (let i = 0; i < points.length; i++) {
        await main.evaluate((node, top) => { node.scrollTop = top }, points[i])
        await page.screenshot({ path: `work/step14/visual/${info.project.name}-${scene}-${i}.png` })
      }
    }
  }
})
