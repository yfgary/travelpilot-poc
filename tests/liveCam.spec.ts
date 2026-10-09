import type { Page } from '@playwright/test'
import { test, expect } from './fixtures'
import { cityContent, roadContent, mediaSnapshot, openContent, seedContentCache } from './contentFixtures'
import { cameraFilterDays } from '../src/data/liveCams'
import { resolveMaps } from '../src/data/itinerary'
import { cacheContents } from './tripFixtures'
import { legacyRoad } from './legacySnapshots'
import schema2Road from './fixtures/schema2-road.json' with { type: 'json' }
import schema3Road from './fixtures/schema3-road.json' with { type: 'json' }
import type { TripSnapshot } from '../src/data/schema/trip'
const cards = (page: Page) => page.getByTestId('camera-card')
const dayNav = (page: Page) => page.getByRole('navigation', { name: 'Live Cam 行程日期' })
const cardById = (page: Page, id: string) => page.locator(`[data-camera-id="${id}"]`)
async function mockMedia(page: Page, fail = false) {
  const requests: string[] = []
  await page.route('https://media.example.invalid/**', async (route) => {
    requests.push(route.request().url())
    if (fail) { await route.abort(); return }
    if (route.request().url().endsWith('.svg')) await route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="#badceb"/><text x="50" y="180">POC TEST IMAGE</text></svg>' })
    else await route.fulfill({ contentType: 'text/html', body: '<html><body style="background:#d7eaf4">POC TEST EMBED</body></html>' })
  })
  return requests
}

test('city empty Live Cam retains shared weather without road leakage or Home shortcut', async ({ page }) => {
  await page.goto('#/trip/demo-trip/live')
  await expect(page.getByTestId('live-cam')).toBeVisible(); await expect(page.getByRole('heading', { level: 1 })).toHaveText('Live Cam')
  await expect(page.getByTestId('weather-panel').locator('.weather-forecast-day')).toHaveCount(5)
  await expect(page.getByRole('heading', { name: '此旅程未設定 Live Cam' })).toBeVisible()
  await expect(cards(page)).toHaveCount(0); await expect(dayNav(page)).toHaveCount(0)
  await expect(page.getByTestId('live-cam')).not.toContainText(roadContent.liveCams[0].label)
  await page.getByRole('navigation', { name: '主導覽' }).getByRole('link', { name: '首頁', exact: true }).click()
  const city = page.getByRole('article').filter({ hasText: cityContent.trip.title })
  const road = page.getByRole('article').filter({ hasText: roadContent.trip.title })
  await expect(city.getByRole('link', { name: 'Live Cam', exact: true })).toHaveCount(0)
  await expect(road.getByRole('link', { name: 'Live Cam', exact: true })).toBeVisible()
})
test('road cameras group geographically with canonical labels, subgroups, descriptions and data badges', async ({ page }) => {
  await page.goto('#/trip/demo-road-trip/live')
  await expect(cards(page)).toHaveCount(3)
  await expect(page.locator('.camera-region-heading h2')).toHaveText(['示範山麓', '示範高地', '其他／全程'])
  await expect(page.locator('.camera-subgroup > h3')).toHaveText(['出發與返回', '示範路線'])
  const camera = cardById(page, 'road-cam')
  await expect(camera).toContainText(roadContent.liveCams[0].description!); await expect(camera).toContainText('必睇'); await expect(camera).toContainText('POC 測試來源')
  for (const tag of roadContent.liveCams[0].tags) await expect(camera.locator('.camera-badges')).toContainText(tag)
  await expect(camera).toContainText(roadContent.places[0].name)
  await expect(camera.getByRole('link', { name: `Google Maps：${roadContent.places[0].name}` })).toHaveAttribute('href', resolveMaps(roadContent.places[0])!)
  await expect(cardById(page, 'road-foothill-cam')).toContainText('參考'); await expect(cardById(page, 'road-global-cam')).toContainText('Backup')
  await expect(page.getByTestId('trip-versions')).toHaveText('Trip Data Version：demo.road.5 · Trip Schema Version：4')
  await expect(page.getByTestId('trip-source')).toContainText('demo')
})
test('day filters include only associated days and multi-day camera appears exactly once per view', async ({ page }) => {
  await page.goto('#/trip/demo-road-trip/live')
  await expect(dayNav(page).getByRole('button')).toHaveText(['全部', ...cameraFilterDays(roadContent).map((day) => `D${day.dayNumber}`)])
  for (const day of roadContent.days) {
    const control = dayNav(page).getByRole('button', { name: `D${day.dayNumber}`, exact: true })
    await control.click(); await expect(control).toHaveAttribute('aria-pressed', 'true')
    await expect(cards(page)).toHaveCount(1)
    await expect(cardById(page, 'road-cam')).toHaveCount([2, 3].includes(day.dayNumber) ? 1 : 0)
    await expect(cardById(page, 'road-global-cam')).toHaveCount(0)
  }
  await dayNav(page).getByRole('button', { name: '全部', exact: true }).click()
  await expect(cards(page)).toHaveCount(3); await expect(cardById(page, 'road-cam')).toHaveCount(1)
})
test('place-only camera resolves its canonical region and global camera has no fabricated day or priority', async ({ page }) => {
  const snapshot = structuredClone(roadContent)
  delete snapshot.liveCams[0].regionId; delete snapshot.liveCams[2].priority
  await openContent(page, snapshot, 'live')
  await expect(page.getByRole('region', { name: '示範高地', exact: true })).toContainText(snapshot.liveCams[0].label)
  const global = cardById(page, 'road-global-cam')
  await expect(global.locator('.camera-badges')).not.toContainText('Backup')
  await expect(global.locator('.camera-badges')).not.toContainText(/D\d/)
  await expect(global.locator('.camera-badges')).toContainText('官方來源')
})
test('unrelated days are absent from filters; globally useful camera remains in All', async ({ page }) => {
  const snapshot = structuredClone(roadContent); snapshot.liveCams = [snapshot.liveCams[0], snapshot.liveCams[2]]
  await openContent(page, snapshot, 'live')
  await expect(dayNav(page).getByRole('button')).toHaveText(['全部', 'D2', 'D3'])
  await expect(cardById(page, 'road-global-cam')).toBeVisible()
})
test('current-day hint uses trip timezone and does not automatically hide other cameras', async ({ page }) => {
  await page.clock.install({ time: new Date('2025-02-05T23:00:00Z') })
  const snapshot = structuredClone(roadContent); snapshot.trip.timezone = 'Pacific/Auckland'
  await openContent(page, snapshot, 'live')
  await expect(dayNav(page).getByRole('button', { name: 'D2 · 今日', exact: true })).toBeVisible()
  await expect(dayNav(page).getByRole('button', { name: '全部', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(cards(page)).toHaveCount(3)
})
test('HTTPS embed is lazy, titled, sandboxed and always offers safe source/official/status actions', async ({ page }) => {
  await mockMedia(page); await openContent(page, mediaSnapshot(), 'live')
  const card = cardById(page, 'embed-test'), frame = card.locator('iframe')
  await expect(frame).toHaveAttribute('src', 'https://media.example.invalid/embed'); await expect(frame).toHaveAttribute('title', '虛構嵌入鏡頭'); await expect(frame).toHaveAttribute('loading', 'lazy')
  await expect(frame).toHaveAttribute('referrerpolicy', 'no-referrer'); await expect(frame).toHaveAttribute('sandbox', 'allow-scripts allow-presentation')
  await expect(frame).toHaveAttribute('allow', 'fullscreen'); await expect(frame).toHaveAttribute('allowfullscreen', '')
  await expect(card).toContainText('部分來源可能拒絕嵌入')
  for (const [label, url] of [['開啟 Live Cam／官方來源', 'embed'], ['官方來源', 'official'], ['查看官方狀態', 'status']]) {
    const link = card.getByRole('link', { name: `${label}：虛構嵌入鏡頭`, exact: true })
    await expect(link).toHaveAttribute('href', `https://media.example.invalid/${url}`); await expect(link).toHaveAttribute('target', '_blank'); await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  }
})
test('HTTPS live image and external preview are lazy with meaningful alt; external website is never framed', async ({ page }) => {
  await mockMedia(page); await openContent(page, mediaSnapshot(), 'live')
  const imageCard = cardById(page, 'image-test'), previewCard = cardById(page, 'preview-test')
  for (const [card, label, filename] of [[imageCard, '虛構靜止畫面', 'image.svg'], [previewCard, '虛構外部預覽', 'preview.svg']] as const) {
    await card.scrollIntoViewIfNeeded(); const image = card.getByRole('img')
    await expect(image).toHaveAttribute('src', `https://media.example.invalid/${filename}`); await expect(image).toHaveAttribute('alt', label); await expect(image).toHaveAttribute('loading', 'lazy')
    await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0)).toBe(true)
    await expect(card.locator('iframe')).toHaveCount(0)
  }
  await expect(imageCard).toContainText('不會自動刷新')
})
test('failed image and preview become non-destructive panels with source action retained', async ({ page }) => {
  await mockMedia(page, true); await openContent(page, mediaSnapshot(), 'live')
  for (const id of ['image-test', 'preview-test']) {
    const card = cardById(page, id); await card.scrollIntoViewIfNeeded()
    await expect(card.getByText('暫時未能載入畫面，請使用下方來源連結。')).toBeVisible()
    await expect(card.getByRole('img')).toHaveCount(0); await expect(card.getByRole('link', { name: /開啟 Live Cam／官方來源/ })).toBeVisible()
  }
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Live Cam')
})
test('HTTP-only embed and image sources stay external, are not rewritten and issue no inline request', async ({ page }) => {
  let insecureRequests = 0
  await page.route('http://media.example.invalid/**', (route) => { insecureRequests++; return route.abort() })
  await mockMedia(page); await openContent(page, mediaSnapshot(), 'live')
  for (const [id, suffix] of [['http-embed-test', 'embed'], ['http-image-test', 'image.svg']]) {
    const card = cardById(page, id); await card.scrollIntoViewIfNeeded()
    await expect(card.locator('iframe, img')).toHaveCount(0); await expect(card).toContainText('HTTP 來源不會在此嵌入')
    await expect(card.getByRole('link', { name: /開啟 Live Cam／官方來源/ })).toHaveAttribute('href', `http://media.example.invalid/${suffix}`)
  }
  expect(insecureRequests).toBe(0)
})
test('identical source/official/status/Maps URLs do not generate duplicate actions or inferred service status', async ({ page }) => {
  const snapshot = structuredClone(roadContent), cam = snapshot.liveCams[0]
  cam.officialURL = cam.sourceURL; cam.statusURL = cam.sourceURL
  snapshot.places[0].mapURL = cam.sourceURL
  await openContent(page, snapshot, 'live')
  const card = cardById(page, cam.id)
  await expect(card.getByRole('link')).toHaveCount(1)
  await expect(card).not.toContainText(/運作正常|道路開放|纜車運行/)
})
test('no media auto-refresh/polling or arbitrary HTML scraping after initial load', async ({ page }) => {
  await page.clock.install(); const requests = await mockMedia(page)
  const snapshot = mediaSnapshot(); snapshot.liveCams = [snapshot.liveCams[1]]
  await openContent(page, snapshot, 'live'); await cards(page).scrollIntoViewIfNeeded()
  await expect.poll(() => requests.length).toBe(1)
  await page.clock.fastForward(120000)
  expect(requests).toEqual(['https://media.example.invalid/image.svg'])
})
for (const original of [legacyRoad, schema2Road as TripSnapshot, schema3Road as TripSnapshot]) test(`physical archived Schema ${original.schemaVersion} cache renders camera day without rewriting or deleting trip data`, async ({ page }) => {
  const snapshot = structuredClone(original)
  snapshot.trip = { ...snapshot.trip, slug: `archived-schema-${original.schemaVersion}`, id: `archived-trip-${original.schemaVersion}` }
  const record = await seedContentCache(page, snapshot), before = await cacheContents(page)
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => false })
    Object.assign(window, { tripCacheWrites: 0 })
    for (const method of ['put', 'add', 'delete', 'clear'] as const) {
      const original = IDBObjectStore.prototype[method]
      Object.assign(IDBObjectStore.prototype, { [method]: function (this: IDBObjectStore, ...args: unknown[]) {
        if (this.transaction.db.name === 'travelpilot-v2-trips') (window as unknown as { tripCacheWrites: number }).tripCacheWrites++
        return Reflect.apply(original, this, args)
      } })
    }
  })
  await page.goto(`#/trip/${snapshot.trip.slug}/live`)
  await expect(page.getByTestId('trip-source')).toContainText('cache'); await expect(page.getByTestId('trip-versions')).toContainText(`Trip Schema Version：${original.schemaVersion}`)
  await expect(cards(page)).toHaveCount(original.liveCams.length)
  await expect(dayNav(page).getByRole('button')).toHaveText(['全部', 'D2'])
  await dayNav(page).getByRole('button', { name: 'D2', exact: true }).click(); await expect(cards(page)).toHaveCount(1)
  await expect(cards(page)).toContainText('D2'); await expect(page.getByTestId('weather-panel')).toBeVisible()
  await page.reload(); await expect(cards(page)).toHaveCount(1)
  expect(await cacheContents(page)).toEqual(before); expect(before.versions).toContainEqual(record)
  expect(await page.evaluate(() => (window as unknown as { tripCacheWrites: number }).tripCacheWrites)).toBe(0)
})
test('remote Schema 4 camera/filter data survives reload and signed-out offline fallback without metadata leakage', async ({ page }) => {
  const snapshot = await openContent(page, roadContent, 'live', 'camera.multi.5')
  await page.reload(); await expect(cards(page)).toHaveCount(3)
  const before = await cacheContents(page)
  await page.addInitScript(() => { localStorage.clear(); Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => false }) })
  await page.reload(); await expect(page.getByTestId('trip-source')).toContainText('cache')
  await expect(cards(page)).toHaveCount(3); await expect(page.getByTestId('trip-versions')).toContainText('camera.multi.5')
  await expect(cards(page).first()).toContainText('目前離線'); expect(await cacheContents(page)).toEqual(before)
  await page.getByRole('navigation', { name: '主導覽' }).getByRole('link', { name: '設定', exact: true }).click(); await page.getByRole('button', { name: '返回上一頁' }).click()
  await expect(page).toHaveURL(new RegExp(`${snapshot.trip.slug}/live$`)); await expect(cards(page)).toHaveCount(3)
})
test('weather region selection is shared across info/Live, while camera filters never alter weather scores', async ({ page }) => {
  let forecastRequests = 0
  page.on('request', (request) => { if (request.url().startsWith('https://api.open-meteo.com/')) forecastRequests++ })
  await page.goto('#/trip/demo-road-trip/info')
  const weather = page.getByTestId('weather-panel')
  await weather.getByRole('button', { name: roadContent.weather.weatherRegions[1].label, exact: true }).click()
  await expect(weather.locator('.weather-score').first()).toBeVisible()
  const score = await weather.locator('.weather-score').first().textContent(), requestsBefore = forecastRequests
  await page.getByRole('navigation', { name: '旅程頁面' }).getByRole('link', { name: 'Live Cam', exact: true }).click()
  await expect(weather).toHaveAttribute('data-weather-region', roadContent.weather.weatherRegions[1].id)
  await dayNav(page).getByRole('button', { name: 'D1', exact: true }).click()
  await expect(weather.locator('.weather-score').first()).toHaveText(score!)
  expect(forecastRequests).toBe(requestsBefore); await expect(weather).toContainText('POC測試警告'); await expect(weather).toContainText('非真實官方警告')
})
for (const size of ['small', 'medium', 'large']) test(`Live Cam ${size} font has safe media, wrapping actions/tags and footer clearance at every width`, async ({ page }) => {
  await page.addInitScript((size) => localStorage.setItem('travelpilot.font-size', size), size)
  const snapshot = mediaSnapshot(); snapshot.liveCams = [snapshot.liveCams[0], snapshot.liveCams[1]]
  for (const cam of snapshot.liveCams) { cam.description = '通用長描述'.repeat(40); cam.tags = ['通用長標籤'.repeat(8), '測試']; cam.label += ' 通用長名稱'.repeat(8) }
  await mockMedia(page); await openContent(page, snapshot, 'live')
  await expect(page.locator('html')).toHaveAttribute('data-font-size', size)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  expect(await page.locator('main').evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true)
  expect(await dayNav(page).evaluate((node) => getComputedStyle(node).overflowX)).toBe('auto')
  for (const action of await page.locator('.camera-card .itinerary-action').all()) expect((await action.boundingBox())!.height).toBeGreaterThanOrEqual(44)
  for (const media of await page.locator('.camera-media').all()) {
    await media.scrollIntoViewIfNeeded(); const box = (await media.boundingBox())!
    expect(Math.abs(box.width / box.height - 16 / 9)).toBeLessThan(.05)
  }
  await dayNav(page).getByRole('button').first().focus(); await page.keyboard.press('ArrowRight'); await expect(dayNav(page).getByRole('button').nth(1)).toBeFocused()
  expect(await dayNav(page).getByRole('button').nth(1).evaluate((node) => getComputedStyle(node).outlineStyle)).not.toBe('none')
  await page.locator('main').evaluate((node) => { node.scrollTop = node.scrollHeight })
  const last = (await cards(page).last().boundingBox())!, dock = (await page.locator('.status-dock').boundingBox())!
  expect(last.y + last.height).toBeLessThanOrEqual(dock.y); await expect(page.getByRole('status')).toContainText('App Version v2.0.0-poc.17')
})
test('cross-trip switch resets camera filter and Settings Back returns exact origin for both trips', async ({ page }) => {
  await page.goto('#/trip/demo-road-trip/live'); await dayNav(page).getByRole('button', { name: 'D2', exact: true }).click()
  await page.getByRole('navigation', { name: '主導覽' }).getByRole('link', { name: '設定', exact: true }).click(); await page.getByRole('button', { name: '返回上一頁' }).click()
  await expect(page).toHaveURL(/demo-road-trip\/live$/); await expect(cards(page)).toHaveCount(3)
  await page.evaluate(() => { history.pushState({ key: crypto.randomUUID(), idx: history.state.idx + 1 }, '', '#/trip/demo-trip/live'); dispatchEvent(new PopStateEvent('popstate')) })
  await expect(page.getByRole('heading', { name: '此旅程未設定 Live Cam' })).toBeVisible(); await expect(cards(page)).toHaveCount(0)
  await expect(page.locator('.trip-heading h2')).toHaveText(cityContent.trip.title)
  await page.getByRole('navigation', { name: '主導覽' }).getByRole('link', { name: '設定', exact: true }).click(); await page.getByRole('button', { name: '返回上一頁' }).click()
  await expect(page).toHaveURL(/demo-trip\/live$/); await expect(cards(page)).toHaveCount(0)
})
