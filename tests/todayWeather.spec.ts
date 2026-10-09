import { test, expect } from './fixtures'
import { openToday, todayFixture } from './todayFixtures'
import { openMeteoResponse } from './weatherFixtures'
import { regionPreferenceKey } from '../src/data/weather/regions'
import { remoteId } from './tripFixtures'
import { forecastRequest } from '../src/services/weather/forecasts'
import { normalizeOpenMeteo } from '../src/services/weather/providers/openMeteo'
import { scoreSuitability } from '../src/data/weather/suitability'

test('actual day uses canonical dayRegions, shared normalized current metrics and exact existing score engine', async ({ page }) => {
  await page.route('https://api.open-meteo.com/**', (route) => route.fulfill({ json: openMeteoResponse('2025-02-05', 18) }))
  const snapshot = await openToday(page), day = snapshot.days[0], id = snapshot.weather.dayRegions.find((mapping) => mapping.dayId === day.id)!.weatherRegionId
  const weather = page.getByTestId('today-weather')
  await expect(weather).toHaveAttribute('data-weather-region', id); await expect(weather).toContainText('當地即時天氣')
  await expect(weather.locator('.today-weather-main')).toContainText('18 °C'); await expect(weather.locator('.today-weather-metrics')).toContainText('17 °C'); await expect(weather.locator('.today-weather-metrics')).toContainText('12 km'); await expect(weather.locator('.today-weather-metrics')).toContainText('24 km/h')
  const normalized = normalizeOpenMeteo(openMeteoResponse('2025-02-05', 18), forecastRequest(snapshot, id)!.request)
  const score = scoreSuitability(snapshot.weather, normalized.current.metrics, { dayId: day.id })
  expect(score.state).toBe('scored')
  if (score.state === 'scored') { await expect(weather.locator('.weather-score-main strong')).toHaveText(score.final.toFixed(1)); await expect(weather.locator('.weather-score-split')).toContainText(`體驗 ${score.experience.toFixed(1)}`); await expect(weather.locator('.weather-score-split')).toContainText(`到達／安全 ${score.access.toFixed(1)}`) }
  await expect(weather).toContainText('觀測／模型時間'); await expect(weather).toContainText('更新時間'); await expect(weather).toContainText('Open-Meteo')
})
test('preview uses matching DailyWeather rather than current conditions and never changes global weather preference', async ({ page }) => {
  const snapshot = todayFixture(), preferred = snapshot.weather.weatherRegions[0].id, key = regionPreferenceKey(remoteId)
  await page.addInitScript(({ key, preferred }) => localStorage.setItem(key, preferred), { key, preferred })
  await page.route('https://api.open-meteo.com/**', (route) => route.fulfill({ json: openMeteoResponse('2025-02-05', 18) }))
  await openToday(page, snapshot)
  await page.getByRole('navigation', { name: '今日模式行程日期' }).getByRole('button', { name: 'D2', exact: true }).click()
  const weather = page.getByTestId('today-weather'), id = snapshot.weather.dayRegions.find((mapping) => mapping.dayId === snapshot.days[1].id)!.weatherRegionId
  await expect(weather).toHaveAttribute('data-weather-region', id); await expect(weather).toContainText('該日預測 · 06/02/2025 星期四')
  await expect(weather.locator('.today-weather-main')).toContainText('13 °C – 21 °C')
  await expect(weather).not.toContainText('目前觀測／模型資料'); await expect(weather).not.toContainText('觀測／模型時間')
  await expect(weather.locator('.weather-score')).toBeVisible(); expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe(preferred)
  await page.getByRole('navigation', { name: '旅程頁面' }).getByRole('link', { name: '旅程資料', exact: true }).click()
  await expect(page.getByTestId('weather-panel')).toHaveAttribute('data-weather-region', preferred)
})
test('outside five-day preview is explicitly simulated in POC without claiming a trip-date forecast', async ({ page }) => {
  await page.route('https://api.open-meteo.com/**', (route) => route.fulfill({ json: openMeteoResponse('2026-10-09') }))
  await openToday(page, todayFixture(), '2026-10-09T10:30:00Z')
  const weather = page.getByTestId('today-weather')
  await expect(weather.getByTestId('today-weather-simulation')).toContainText('POC 模擬天氣（畫面測試）')
  await expect(weather.getByTestId('today-weather-simulation')).toContainText('並非該行程日期的預測')
  await expect(weather.locator('.today-weather-main')).toBeVisible()
  await expect(weather.locator('.today-weather-metrics')).toBeVisible()
  await expect(weather.locator('.weather-score')).toBeVisible()
  await expect(weather).toContainText('現時天氣樣本')
})
test('shared forecast request is deduplicated across tick updates and reused after switching to WeatherPanel', async ({ page }) => {
  let calls = 0
  await page.route('https://api.open-meteo.com/**', (route) => { calls++; return route.fulfill({ json: openMeteoResponse('2025-02-05') }) })
  await openToday(page); await expect(page.getByTestId('today-weather')).toContainText('天氣資料已更新'); expect(calls).toBe(1)
  await page.clock.runFor(12000); expect(calls).toBe(1)
  await page.getByRole('navigation', { name: '旅程頁面' }).getByRole('link', { name: '旅程資料', exact: true }).click()
  await expect(page.getByTestId('weather-panel').locator('.weather-current')).toBeVisible(); expect(calls).toBe(1)
})
test('shared weather cache retains truthful stale/offline conditions and core progress remains usable', async ({ page }) => {
  await page.route('https://api.open-meteo.com/**', (route) => route.fulfill({ json: openMeteoResponse('2025-02-05') }))
  await openToday(page); await expect(page.getByTestId('today-weather')).toContainText('天氣資料已更新')
  await page.context().setOffline(true)
  await expect(page.getByTestId('today-weather')).toContainText('離線，顯示已儲存天氣資料')
  await expect(page.getByTestId('today-weather').locator('.today-weather-main')).toContainText('18 °C')
  await page.getByRole('button', { name: '已到達／下一項 →', exact: true }).click(); await expect(page.locator('.today-current')).toContainText('主要計劃目的地')
  await expect(page.getByRole('region', { name: '主要導航目的地', exact: true })).toContainText('Maps 為外部操作')
})
test('weather network failure never blocks day/manual/Maps/Hard Cut/住宿 content', async ({ page }) => {
  await page.route('https://api.open-meteo.com/**', (route) => route.abort())
  await openToday(page)
  await expect(page.getByTestId('today-weather')).toContainText('暫時未能取得天氣資料')
  await expect(page.locator('.today-hard-cut')).toHaveCount(3); await expect(page.locator('.today-final')).toBeVisible()
  await expect(page.getByRole('region', { name: '主要導航目的地', exact: true }).getByRole('link', { name: /Google Maps/ })).toBeVisible()
  await page.getByRole('button', { name: '已到達／下一項 →', exact: true }).click(); await expect(page.locator('.today-current')).toContainText('手動焦點')
})
test('active official alerts reuse normalized state, filter selected region and do not override progress or scores', async ({ page }) => {
  const snapshot = todayFixture(), [first, second] = snapshot.weather.weatherRegions
  snapshot.weather.alertProviders = [{ id: 'today-alert-provider', adapter: 'demo-alerts', label: '虛構測試供應商', weatherRegionIds: [first.id, second.id], config: { alerts: [
    { id: 'today-selected-alert', type: 'wind', severity: 'severe', title: '所選地區虛構警告', weatherRegionIds: [first.id], durationHours: 1, instruction: '請查閱測試說明。', officialUrl: 'https://example.invalid/alert' },
    { id: 'today-unrelated-alert', type: 'snow', severity: 'minor', title: '其他地區虛構警告', weatherRegionIds: [second.id], durationHours: 1 },
  ] } }]
  await openToday(page, snapshot)
  const weather = page.getByTestId('today-weather'), alerts = weather.getByRole('region', { name: '官方警告', exact: true })
  await expect(alerts).toContainText('所選地區虛構警告'); await expect(alerts).not.toContainText('其他地區虛構警告')
  await expect(alerts).toContainText('POC測試警告'); await expect(alerts).toContainText('非真實官方警告'); await expect(alerts).toContainText('強風 · 嚴重')
  await expect(page.getByTestId('today-mode')).toHaveAttribute('data-progress-mode', 'auto'); await expect(page.locator('.today-current')).toContainText('可選短暫停留')
  await page.getByRole('navigation', { name: '今日模式行程日期' }).getByRole('button', { name: 'D2', exact: true }).click()
  await expect(alerts).toContainText('其他地區虛構警告'); await expect(alerts).not.toContainText('所選地區虛構警告')
})
test('rich schema without a selected-day weather mapping has an honest informational state', async ({ page }) => {
  const snapshot = todayFixture(); snapshot.weather.dayRegions = []
  await openToday(page, snapshot)
  await expect(page.getByTestId('today-weather')).toContainText('所選行程日尚未設定天氣地區。')
  await expect(page.getByTestId('today-weather').locator('.weather-score')).toHaveCount(0)
})
