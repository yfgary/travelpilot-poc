import { createHash } from 'node:crypto'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import type { Page } from '@playwright/test'
import { test, expect, supabaseOrigin } from './fixtures'
import { localTrips } from '../src/data/trips'
import { validateTripSnapshot, type Schema4Snapshot, type TripSnapshot } from '../src/data/schema/trip'
import { legacyRoad } from './legacySnapshots'
import schema3Road from './fixtures/schema3-road.json' with { type: 'json' }
import schema2Road from './fixtures/schema2-road.json' with { type: 'json' }
import { openMeteoResponse, weatherCacheContents } from './weatherFixtures'
import { mockRemote, seedAuth, remoteVersion, remoteId, remoteSlug, cacheContents } from './tripFixtures'
import { regionPreferenceKey } from '../src/data/weather/regions'
import { forecastRequest, loadForecast } from '../src/services/weather/forecasts'
const city = localTrips[1].payload as Schema4Snapshot, road = localTrips[0].payload as Schema4Snapshot
const panel = (page: Page) => page.getByTestId('weather-panel')
async function open(page: Page, slug = city.trip.slug, view = 'info') {
  await page.goto(`#/trip/${slug}/${view}`)
  await expect(panel(page).locator('.weather-forecast-day')).toHaveCount(5)
}
async function remote(page: Page, original: TripSnapshot, version = 'weather.1') {
  const snapshot = structuredClone(original); snapshot.trip = { ...snapshot.trip, id: remoteId, slug: remoteSlug }
  expect(validateTripSnapshot(snapshot).valid).toBe(true)
  await seedAuth(page); await mockRemote(page, () => ({ ...remoteVersion(), schema_version: snapshot.schemaVersion, data_version: version, payload: snapshot }))
  if (page.url() !== 'about:blank') await page.reload()
  await page.goto(`#/trip/${remoteSlug}/info`)
  await expect(page.getByTestId('trip-information')).toBeVisible()
  return snapshot
}
async function expire(page: Page) {
  await page.evaluate(async () => {
    const request = indexedDB.open('travelpilot-v2-weather-cache', 1)
    const db = await new Promise<IDBDatabase>((resolve) => { request.onsuccess = () => resolve(request.result) })
    const tx = db.transaction('forecasts', 'readwrite'), store = tx.objectStore('forecasts'), get = store.getAll()
    get.onsuccess = () => { for (const record of get.result) store.put({ ...record, payload: { ...record.payload, fetchedAt: new Date(Date.now() - 11 * 60000).toISOString() } }) }
    await new Promise<void>((resolve) => { tx.oncomplete = () => resolve() }); db.close()
  })
}
for (const view of ['itinerary', 'info', 'live']) test(`${view} uses shared normalized weather, score, attribution and five forecast cards`, async ({ page }) => {
  await open(page, city.trip.slug, view)
  await expect(panel(page).getByRole('heading', { name: '天氣與活動適宜度', exact: true })).toBeVisible()
  await expect(panel(page).locator('.weather-metrics')).toContainText('12 km')
  await expect(panel(page).locator('.weather-metrics')).toContainText('15 cm')
  await expect(panel(page).locator('.weather-score').first()).toContainText('體驗')
  await expect(panel(page).locator('.weather-score').first()).toContainText('到達／安全')
  await expect(panel(page).locator('.weather-operation').first()).toContainText('官方運行狀態優先於天氣分數')
  await expect(panel(page).locator('.weather-trend')).toHaveCount(2)
  await expect(panel(page).getByRole('link', { name: 'Open-Meteo', exact: true })).toHaveAttribute('href', 'https://open-meteo.com/')
  await expect(panel(page).getByRole('region', { name: '官方警告', exact: true })).toHaveCount(0)
  await expect(page.getByRole('status')).toContainText('App Version v2.0.0-poc.15')
  if (view === 'live') { await expect(page.getByTestId('live-cam')).toBeVisible(); await expect(page.getByRole('heading', { name: '此旅程未設定 Live Cam' })).toBeVisible() }
})
test('weather is absent from Home, Settings, Attractions and Today placeholders', async ({ page }) => {
  for (const route of ['#/', '#/settings', '#/trip/demo-trip/attractions', '#/trip/demo-trip/today']) {
    await page.goto(route); await expect(page.getByRole('status')).toBeVisible(); await expect(panel(page)).toHaveCount(0)
  }
})
test('road region selector is data-driven; fictional alert has explicit labels, affected region and safe source link', async ({ page }) => {
  await open(page, road.trip.slug)
  await expect(panel(page).getByRole('group', { name: '天氣地區' }).getByRole('button')).toHaveText(road.weather.weatherRegions.map((r) => r.label))
  await expect(panel(page).getByRole('region', { name: '官方警告', exact: true })).toHaveCount(0)
  await panel(page).getByRole('button', { name: road.weather.weatherRegions[1].label, exact: true }).click()
  const alerts = panel(page).getByRole('region', { name: '官方警告', exact: true })
  await expect(alerts).toBeVisible(); await expect(alerts).toContainText('POC測試警告'); await expect(alerts).toContainText('非真實官方警告'); await expect(alerts).toContainText('強風 · 中等')
  await expect(alerts).toContainText('來源：POC 虛構警告資料'); await expect(alerts).toContainText('發出：'); await expect(alerts).toContainText('到期：')
  await expect(alerts.getByRole('link', { name: '測試警告來源' })).toHaveAttribute('rel', 'noopener noreferrer')
  await expect(panel(page).locator('.weather-current')).toBeVisible()
  expect((await alerts.boundingBox())!.y).toBeLessThan((await panel(page).locator('.weather-current').boundingBox())!.y)
})
test('selected region persists per trip and another trip never receives it', async ({ page }) => {
  await open(page, road.trip.slug)
  await panel(page).getByRole('button', { name: road.weather.weatherRegions[1].label }).click()
  await expect(panel(page)).toHaveAttribute('data-weather-region', road.weather.weatherRegions[1].id)
  await page.reload(); await expect(panel(page)).toHaveAttribute('data-weather-region', road.weather.weatherRegions[1].id)
  await expect(panel(page).locator('.weather-forecast-day')).toHaveCount(5)
  await open(page, city.trip.slug); await expect(panel(page)).toHaveAttribute('data-weather-region', 'city-weather')
  expect(await page.evaluate((key) => localStorage.getItem(key), regionPreferenceKey(road.trip.id))).toBe(road.weather.weatherRegions[1].id)
})
test('blocked localStorage and IndexedDB keep weather usable without pretending offline storage succeeded', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', (error) => errors.push(error.message))
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new DOMException('blocked', 'SecurityError') }; Storage.prototype.setItem = () => { throw new DOMException('blocked', 'SecurityError') }
    indexedDB.open = () => { throw new DOMException('blocked', 'SecurityError') }
  })
  await open(page, road.trip.slug)
  await panel(page).getByRole('button', { name: road.weather.weatherRegions[1].label }).click()
  await expect(panel(page).locator('.weather-forecast-day')).toHaveCount(5)
  await expect(panel(page)).toContainText('此裝置暫時未能儲存離線天氣資料。'); expect(errors).toEqual([])
})
test('fresh weather cache survives reload and avoids another network request', async ({ page }) => {
  let calls = 0
  await page.route('https://api.open-meteo.com/**', async (route) => { calls++; await route.fulfill({ json: openMeteoResponse() }) })
  await open(page); const before = await weatherCacheContents(page)
  expect(before).toHaveLength(1); expect(before[0].key).toEqual([city.trip.id, 'city-weather', city.weather.forecastProviders[0].id])
  await page.reload(); await expect(panel(page).locator('.weather-forecast-day')).toHaveCount(5)
  await expect(panel(page).locator('.weather-state')).toHaveText('顯示已儲存天氣資料')
  expect(calls).toBe(1); expect(await weatherCacheContents(page)).toEqual(before)
})
test('expired cache refreshes online; manual refresh bypasses TTL without clearing cache', async ({ page }) => {
  let calls = 0
  await page.route('https://api.open-meteo.com/**', async (route) => { calls++; await route.fulfill({ json: openMeteoResponse(undefined, 10 + calls) }) })
  await open(page); await expire(page); await page.reload(); await expect(panel(page).locator('.weather-temperature')).toHaveText('12 °C')
  expect(calls).toBe(2); await panel(page).getByRole('button', { name: '刷新', exact: true }).click()
  await expect(panel(page).locator('.weather-temperature')).toHaveText('13 °C'); expect(calls).toBe(3)
  expect((await weatherCacheContents(page))[0].payload.current.metrics.temperatureC).toBe(13)
})
for (const failure of ['non-OK', 'malformed'] as const) test(`${failure} manual refresh preserves valid cache and visibly marks stale data`, async ({ page }) => {
  await open(page); const before = await weatherCacheContents(page)
  await page.route('https://api.open-meteo.com/**', (route) => failure === 'non-OK' ? route.fulfill({ status: 503, json: {} }) : route.fulfill({ json: { current: null } }))
  await panel(page).getByRole('button', { name: '刷新', exact: true }).click()
  await expect(panel(page).locator('.weather-state')).toHaveText('正在使用較早前快取資料')
  await expect(panel(page).locator('.weather-update')).toContainText('更新時間：')
  await expect(panel(page).locator('.weather-forecast-day')).toHaveCount(5); expect(await weatherCacheContents(page)).toEqual(before)
})
test('offline cached forecast remains readable; signed-out local trip is unaffected', async ({ page }) => {
  await open(page); const before = await weatherCacheContents(page)
  await page.addInitScript(() => Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => false }))
  await page.reload(); await expect(panel(page).locator('.weather-state')).toHaveText('離線，顯示已儲存天氣資料')
  await expect(panel(page).locator('.weather-forecast-day')).toHaveCount(5); expect(await weatherCacheContents(page)).toEqual(before)
  await expect(page.getByRole('status')).toContainText('OFFLINE')
})
test('offline without weather cache and first-fetch failure give friendly states without raw errors', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => false }))
  await page.goto('#/trip/demo-trip/info'); await expect(panel(page)).toContainText('離線，尚未有已儲存天氣資料')
  await expect(page.getByTestId('trip-information')).toBeVisible(); await expect(panel(page).locator('.weather-forecast-day')).toHaveCount(0)
})
test('online provider failure without cache leaves trip content available', async ({ page }) => {
  await page.route('https://api.open-meteo.com/**', (route) => route.fulfill({ status: 500, json: { message: 'private provider diagnostic' } }))
  await page.goto('#/trip/demo-trip/info'); await expect(panel(page)).toContainText('暫時未能取得天氣資料'); await expect(panel(page)).not.toContainText('private provider diagnostic')
  await expect(page.locator('.info-checklists')).toBeVisible()
})
test('two trip and region cache identities retain their own payloads', async ({ page }) => {
  await page.route('https://api.open-meteo.com/**', (route) => {
    const latitude = Number(new URL(route.request().url()).searchParams.get('latitude'))
    return route.fulfill({ json: openMeteoResponse(undefined, latitude === 0 ? 18 : latitude === 10 ? 8 : -2) })
  })
  await open(page); await open(page, road.trip.slug)
  await panel(page).getByRole('button', { name: road.weather.weatherRegions[1].label }).click(); await expect(panel(page).locator('.weather-temperature')).toHaveText('-2 °C')
  const records = await weatherCacheContents(page); expect(records).toHaveLength(3)
  expect(new Set(records.map((r) => JSON.stringify(r.key))).size).toBe(3)
  expect(records.find((r) => r.key[0] === city.trip.id)?.payload.current.metrics.temperatureC).toBe(18)
  await page.addInitScript(() => Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => false }))
  await page.reload(); await expect(panel(page).locator('.weather-temperature')).toHaveText('-2 °C')
  await open(page); await expect(panel(page).locator('.weather-temperature')).toHaveText('18 °C')
})
test('late previous-region response never replaces selected region weather', async ({ page }) => {
  let release!: () => void; const gate = new Promise<void>((resolve) => { release = resolve })
  await page.route('https://api.open-meteo.com/**', async (route) => { const low = new URL(route.request().url()).searchParams.get('latitude') === '10'; if (low) await gate; await route.fulfill({ json: openMeteoResponse(undefined, low ? 8 : -2) }) })
  await page.goto('#/trip/demo-road-trip/info'); await expect(panel(page)).toBeVisible()
  await panel(page).getByRole('button', { name: road.weather.weatherRegions[1].label }).click(); await expect(panel(page).locator('.weather-temperature')).toHaveText('-2 °C')
  release(); await expect.poll(async () => (await weatherCacheContents(page)).length).toBe(2)
  await expect(panel(page)).toHaveAttribute('data-weather-region', 'road-weather-high'); await expect(panel(page).locator('.weather-temperature')).toHaveText('-2 °C')
})
test('quick page navigation deduplicates the shared pending request', async ({ page }) => {
  let calls = 0, release!: () => void; const gate = new Promise<void>((resolve) => { release = resolve })
  await page.route('https://api.open-meteo.com/**', async (route) => { calls++; await gate; await route.fulfill({ json: openMeteoResponse() }) })
  await page.goto('#/trip/demo-trip/info'); await expect(panel(page)).toBeVisible()
  await expect.poll(() => calls).toBe(1)
  await page.getByRole('navigation', { name: '旅程頁面' }).getByRole('link', { name: '詳細行程', exact: true }).click()
  await page.getByRole('navigation', { name: '旅程頁面' }).getByRole('link', { name: 'Live Cam', exact: true }).click()
  release(); await expect(panel(page).locator('.weather-forecast-day')).toHaveCount(5); expect(calls).toBe(1)
})
test('service in-flight registry deduplicates separate simultaneous consumers without browser storage', async () => {
  const snapshot = structuredClone(city); snapshot.trip.id = 'dedup-service-test'
  const original = globalThis.fetch; let calls = 0
  globalThis.fetch = async () => { calls++; await new Promise((resolve) => setTimeout(resolve, 20)); return new Response(JSON.stringify(openMeteoResponse()), { status: 200 }) }
  try {
    const results = await Promise.all([loadForecast(snapshot, 'city-weather', { online: true, force: true }), loadForecast(snapshot, 'city-weather', { online: true, force: true })])
    expect(calls).toBe(1); expect(results[0]).toEqual(results[1]); expect(results[0]).toMatchObject({ state: 'ready', cacheSaved: false })
  } finally { globalThis.fetch = original }
})
test('late old-trip response cannot leak into another trip after navigation', async ({ page }) => {
  let release!: () => void; const gate = new Promise<void>((resolve) => { release = resolve })
  await page.route('https://api.open-meteo.com/**', async (route) => { const city = new URL(route.request().url()).searchParams.get('latitude') === '0'; if (city) await gate; await route.fulfill({ json: openMeteoResponse(undefined, city ? 33 : 5) }) })
  await page.goto('#/trip/demo-trip/info'); await expect(panel(page)).toBeVisible()
  await open(page, road.trip.slug); release(); await expect.poll(async () => (await weatherCacheContents(page)).length).toBe(2)
  await expect(panel(page).locator('.weather-temperature')).toHaveText('5 °C'); await expect(page.locator('.trip-heading')).toContainText(road.trip.title); await expect(panel(page)).not.toContainText('33 °C')
})
test('mapped itinerary date receives its own forecast score; other dates get no fabricated score', async ({ page }) => {
  await page.route('https://api.open-meteo.com/**', (route) => route.fulfill({ json: openMeteoResponse('2025-02-05') }))
  await open(page, road.trip.slug, 'itinerary')
  await expect(page.locator('.itinerary-day').first().getByTestId('day-suitability')).toBeVisible()
  await expect(page.locator('.itinerary-day').first().getByTestId('day-suitability')).toContainText('體驗')
  await expect(page.locator('.itinerary-day').first().getByTestId('day-suitability')).toContainText('到達／安全')
  await open(page, city.trip.slug, 'itinerary'); await expect(page.getByTestId('day-suitability')).toHaveCount(0); await expect(page.getByTestId('day-weather-outside').first()).toBeVisible()
  await expect(panel(page)).toContainText('未代表實際行程日天氣')
})
test('day mapping selects its configured region metrics, independent of current selector', async ({ page }) => {
  await page.route('https://api.open-meteo.com/**', (route) => { const high = new URL(route.request().url()).searchParams.get('latitude') === '11.1'; const raw = openMeteoResponse('2025-02-05'); if (high) raw.daily.wind_gusts_10m_max = Array(5).fill(80); return route.fulfill({ json: raw }) })
  await open(page, road.trip.slug, 'itinerary')
  await page.getByRole('button', { name: '跳至 DAY 2', exact: true }).click()
  const day = page.locator('.itinerary-day').nth(1); await expect(day.getByTestId('day-suitability')).toBeVisible()
  const before = await day.getByTestId('day-suitability').textContent()
  await panel(page).getByRole('button', { name: road.weather.weatherRegions[1].label }).click()
  await expect(day.getByTestId('day-suitability')).toHaveText(before!)
})
test('all fonts keep metrics/alerts readable and forecast horizontally scrollable without body overflow', async ({ page }) => {
  for (const [label, size] of [['小', 'small'], ['中', 'medium'], ['大', 'large']] as const) {
    await page.goto('#/settings'); await page.getByRole('radio', { name: label, exact: true }).check()
    await open(page, road.trip.slug); await panel(page).getByRole('button', { name: road.weather.weatherRegions[1].label }).click()
    await expect(panel(page)).toHaveAttribute('data-weather-region', 'road-weather-high'); await expect(panel(page).locator('.weather-forecast-day')).toHaveCount(5)
    await expect(page.locator('html')).toHaveAttribute('data-font-size', size)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    expect(await page.locator('main').evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
    const scroller = panel(page).getByRole('region', { name: '未來5日預測，可橫向捲動' })
    const metrics = await scroller.evaluate((element) => ({ width: element.clientWidth, scroll: element.scrollWidth, y: [...element.children].map((child) => child.getBoundingClientRect().y) }))
    expect(new Set(metrics.y).size).toBe(1)
    if (page.viewportSize()!.width < 700) expect(metrics.scroll).toBeGreaterThan(metrics.width)
    await scroller.focus(); await page.keyboard.press('ArrowRight'); await expect(scroller).toBeFocused()
    if (page.viewportSize()!.width < 700) await expect.poll(() => scroller.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0)
    expect(await scroller.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe('none')
    const refresh = await panel(page).getByRole('button', { name: '刷新', exact: true }).boundingBox(); expect(refresh!.height).toBeGreaterThanOrEqual(44)
    await page.locator('main').evaluate((element) => { element.scrollTop = element.scrollHeight }); await expect(page.getByRole('status')).toBeVisible()
    expect((await panel(page).boundingBox())!.y + (await panel(page).boundingBox())!.height).toBeLessThanOrEqual((await page.locator('.status-dock').boundingBox())!.y)
  }
})
for (const original of [legacyRoad, schema2Road as TripSnapshot]) test(`genuine Schema ${original.schemaVersion} cache remains readable without trip rewrites or weather fabrication`, async ({ page }) => {
  await remote(page, original); await expect(page.getByTestId('trip-source')).toContainText('remote'); const before = await cacheContents(page)
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => false })
    const put = IDBObjectStore.prototype.put
    ;(window as typeof window & { tripWrites: number }).tripWrites = 0
    IDBObjectStore.prototype.put = function (...args) { if (this.transaction.db.name === 'travelpilot-v2-trips') (window as typeof window & { tripWrites: number }).tripWrites++; return put.apply(this, args) }
  })
  await page.reload(); await expect(page.getByTestId('trip-source')).toContainText('cache'); await expect(panel(page)).toContainText('此旅程資料格式未提供天氣供應商及評分設定。')
  await expect(panel(page).locator('.weather-forecast-day')).toHaveCount(0); expect(await cacheContents(page)).toEqual(before)
  expect(await page.evaluate(() => (window as typeof window & { tripWrites: number }).tripWrites)).toBe(0)
})
test('unregistered forecast adapter degrades without guessing a provider from geography', async ({ page }) => {
  const snapshot = structuredClone(city); snapshot.weather.forecastProviders[0].adapter = 'unregistered'
  await remote(page, snapshot); await expect(panel(page)).toContainText('此地區尚未有可用天氣供應商設定。'); await expect(panel(page).locator('.weather-forecast-day')).toHaveCount(0)
})
test('weather/alerts boundaries prohibit trip branches, Supabase writes, migration changes and legacy provider keys', () => {
  const files = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? files(join(dir, entry.name)) : [join(dir, entry.name)])
  for (const path of [...files('src/services/weather'), ...files('src/data/weather'), ...files('src/components/weather'), 'src/app/TripWeather.tsx', 'src/offline/weatherCache.ts']) {
    const source = readFileSync(path, 'utf8')
    expect(source).not.toMatch(/Japan|Nagoya|Shirakawa|Shinhotaka|Hakuba|Takayama|Bangkok|Hokkaido|demo-trip|demo-road-trip|DEFAULT_TRIP|Japan2027Core|loadTrip\(|supabase|trip_checklist_state|trip_checklist_shared|trip_sync_config|sb_secret_|service_role|\.from\(|country\s*===|dayNumber\s*===|placeId\s*===/)
  }
  expect(readFileSync('src/views/DetailedItinerary.tsx', 'utf8')).toContain('<WeatherPanel />')
  expect(readFileSync('src/views/TripInformation.tsx', 'utf8')).toContain('<WeatherPanel />')
  expect(readFileSync('src/views/TripView.tsx', 'utf8')).toContain('<WeatherPanel />')
  expect(readdirSync('supabase/migrations')).toEqual(['20261008135932_step11_checklist_client_clock.sql'])
  expect(createHash('sha256').update(readFileSync('supabase/migrations/20261008135932_step11_checklist_client_clock.sql')).digest('hex')).toBe('dd7737b5f7dfd695cc5df3550ced00f37889c05481a910ad0134725819012d55')
})

test('Schema 2 and Schema 3 remote trip versions coexist and retain separate source contracts offline', async ({ page }) => {
  await remote(page, schema2Road as TripSnapshot, 'before-weather.1')
  await expect(page.getByTestId('trip-source')).toContainText('remote'); const old = (await cacheContents(page)).versions[0]
  await remote(page, schema3Road as TripSnapshot, 'weather.3'); await expect(panel(page).locator('.weather-forecast-day')).toHaveCount(5)
  const versions = await cacheContents(page); expect(versions.versions).toHaveLength(2); expect(versions.versions).toContainEqual(old)
  await page.addInitScript(() => Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => false }))
  await page.reload(); await expect(page.getByTestId('trip-source')).toContainText('cache'); await expect(page.getByTestId('trip-versions')).toContainText('Trip Schema Version：3')
  await expect(panel(page).locator('.weather-forecast-day')).toHaveCount(5); expect(await cacheContents(page)).toEqual(versions)
})
test('forecast sample/config changes cannot silently reuse an old cache for the same region ID', async ({ page }) => {
  let calls = 0
  await page.route('https://api.open-meteo.com/**', (route) => { calls++; const latitude = Number(new URL(route.request().url()).searchParams.get('latitude')); return route.fulfill({ json: openMeteoResponse(undefined, latitude) }) })
  await remote(page, city, 'sample.1'); await expect(panel(page).locator('.weather-temperature')).toHaveText('0 °C')
  const changed = structuredClone(city); changed.weather.weatherRegions[0].location = { latitude: 22, longitude: 22 }
  await remote(page, changed, 'sample.2'); await expect(panel(page).locator('.weather-temperature')).toHaveText('22 °C'); expect(calls).toBe(2)
})
test('tampered cache identity never renders another trip payload', async ({ page }) => {
  await open(page)
  await page.evaluate(async () => {
    const request = indexedDB.open('travelpilot-v2-weather-cache', 1)
    const db = await new Promise<IDBDatabase>((resolve) => { request.onsuccess = () => resolve(request.result) })
    const tx = db.transaction('forecasts', 'readwrite'), store = tx.objectStore('forecasts'), get = store.getAll()
    get.onsuccess = () => store.put({ ...get.result[0], payload: { ...get.result[0].payload, tripId: 'another-trip' } })
    await new Promise<void>((resolve) => { tx.oncomplete = () => resolve() }); db.close()
  })
  await page.addInitScript(() => Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => false }))
  await page.reload(); await expect(panel(page)).toContainText('尚未有已儲存天氣資料'); await expect(panel(page).locator('.weather-temperature')).toHaveCount(0)
})
test('long region/profile/alert labels still fit Large font without whole-page overflow', async ({ page }) => {
  await page.goto('#/settings'); await page.getByRole('radio', { name: '大', exact: true }).check()
  const snapshot = structuredClone(road)
  snapshot.weather.weatherRegions[1].label = '虛構高地景觀與道路座標樣本地區'.repeat(4)
  snapshot.weather.activityProfiles[0].label = '戶外景觀與步行活動'.repeat(5)
  const alerts = snapshot.weather.alertProviders[0].config!.alerts as Record<string, unknown>[]
  alerts[0].title = '虛構測試警告文字'.repeat(8)
  await remote(page, snapshot); await panel(page).getByRole('button', { name: snapshot.weather.weatherRegions[1].label }).click()
  await expect(panel(page).locator('.weather-forecast-day')).toHaveCount(5)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  expect(await page.locator('main').evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
})

test('pre-Step12 physical Schema 2 cache loads signed out without any trip-store writes or storage upgrade', async ({ page }) => {
  await page.goto('#/')
  const snapshot = structuredClone(schema2Road) as TripSnapshot
  snapshot.trip = { ...snapshot.trip, id: remoteId, slug: remoteSlug }
  await page.evaluate(async (payload) => {
    const request = indexedDB.open('travelpilot-v2-trips', 1)
    request.onupgradeneeded = () => { const db = request.result; db.createObjectStore('versions', { keyPath: ['tripId', 'dataVersion'] }); db.createObjectStore('current', { keyPath: ['slug', 'ownerId'] }); db.createObjectStore('deviceCurrent', { keyPath: 'slug' }) }
    const db = await new Promise<IDBDatabase>((resolve) => { request.onsuccess = () => resolve(request.result) })
    const pointer = { tripId: payload.trip.id, slug: payload.trip.slug, ownerId: '00000000-0000-4000-8000-000000000001', dataVersion: 'pre-step12.2' }
    const record = { ...pointer, schemaVersion: 2, payload, cachedAt: '2026-10-08T00:00:00Z' }
    const tx = db.transaction(['versions', 'current', 'deviceCurrent'], 'readwrite')
    tx.objectStore('versions').put(record); tx.objectStore('current').put(pointer); tx.objectStore('deviceCurrent').put(pointer)
    await new Promise<void>((resolve) => { tx.oncomplete = () => resolve() }); db.close()
  }, snapshot)
  const before = await cacheContents(page)
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => false })
    const put = IDBObjectStore.prototype.put
    ;(window as typeof window & { tripWrites: number }).tripWrites = 0
    IDBObjectStore.prototype.put = function (...args) { if (this.transaction.db.name === 'travelpilot-v2-trips') (window as typeof window & { tripWrites: number }).tripWrites++; return put.apply(this, args) }
  })
  await page.reload(); await page.goto(`#/trip/${remoteSlug}/info`)
  await expect(page.getByTestId('trip-source')).toContainText('cache'); await expect(page.getByTestId('trip-versions')).toContainText('Trip Schema Version：2')
  await expect(panel(page)).toContainText('此旅程資料格式未提供天氣供應商及評分設定。')
  expect(await cacheContents(page)).toEqual(before); expect(await page.evaluate(() => (window as typeof window & { tripWrites: number }).tripWrites)).toBe(0)
  expect(await page.evaluate(async () => (await indexedDB.databases()).find((db) => db.name === 'travelpilot-v2-trips')?.version)).toBe(1)
})
