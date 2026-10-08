import type { Page } from '@playwright/test'
import { test, expect, supabaseOrigin } from './fixtures'
import { cityContent, roadContent, openContent } from './contentFixtures'
import { derivePlaceUsage, groupPlaceUsage, placeUsageCounts } from '../src/data/attractions'
import { resolveMaps } from '../src/data/itinerary'
import { cacheContents, remoteSlug } from './tripFixtures'
const cards = (page: Page) => page.getByTestId('attraction-card')
const regionNav = (page: Page) => page.getByRole('navigation', { name: '景點地區' })

for (const snapshot of [cityContent, roadContent]) test(`${snapshot.trip.slug} dedicated overview uses canonical places, facts and deterministic regions`, async ({ page }) => {
  await page.goto(`#/trip/${snapshot.trip.slug}/attractions`)
  const usage = derivePlaceUsage(snapshot), groups = groupPlaceUsage(snapshot, usage, 'all')
  await expect(page.getByTestId('attractions-overview')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('景點總覽')
  await expect(cards(page)).toHaveCount(usage.length)
  await expect(page.locator('.attraction-region-heading h2')).toHaveText(groups.map((group) => group.label))
  await expect(regionNav(page).getByRole('button')).toHaveText(groups.map((group) => `${group.label} · ${group.places.length}`))
  for (const item of usage) {
    const card = cards(page).filter({ has: page.getByRole('heading', { name: item.place.name, exact: true }) })
    await expect(card).toContainText(item.place.summary)
    if (item.place.rating !== undefined) await expect(card).toContainText(`${item.place.rating} / 10`)
    await expect(card.getByRole('button', { name: `詳細介紹：${item.place.name}` })).toBeVisible()
    if (resolveMaps(item.place)) await expect(card.getByRole('link', { name: `Google Maps：${item.place.name}` })).toHaveAttribute('href', resolveMaps(item.place)!)
  }
  await expect(page.getByTestId('weather-panel')).toHaveCount(0)
  await expect(page.getByTestId('trip-versions')).toContainText(snapshot === cityContent ? 'demo.city.5' : 'demo.road.5')
})
test('overview counts overlap while every filter renders a multi-status place only once', async ({ page }) => {
  const snapshot = structuredClone(roadContent), place = snapshot.places[0]
  snapshot.days[1].optionalContent.push({ type: 'place', id: place.id }); snapshot.days[2].backupContent.push({ type: 'place', id: place.id })
  snapshot.days[1].timeline.push({ id: 'repeat-place-main', type: 'activity', title: '重複安排', optional: false, placeId: place.id })
  await openContent(page, snapshot, 'attractions')
  const counts = placeUsageCounts(derivePlaceUsage(snapshot))
  for (const [filter, label] of [['all', '全部'], ['main', '主行程'], ['optional', '可選／Bonus'], ['backup', '備用']] as const) {
    const control = page.getByRole('group', { name: '景點行程分類' }).getByRole('button', { name: `${label} ${counts[filter]}`, exact: true })
    await control.click(); await expect(control).toHaveAttribute('aria-pressed', 'true')
    await expect(cards(page)).toHaveCount(counts[filter])
    await expect(cards(page).filter({ has: page.getByRole('heading', { name: place.name, exact: true }) })).toHaveCount(1)
  }
  const badges = cards(page).filter({ has: page.getByRole('heading', { name: place.name, exact: true }) }).locator('.attraction-badges')
  await expect(badges).toContainText('主行程'); await expect(badges).toContainText('可選／Bonus'); await expect(badges).toContainText('備用')
  await expect(badges.getByText('D2', { exact: true })).toHaveCount(1); await expect(badges.getByText('D3', { exact: true })).toHaveCount(1)
})
test('rich attraction facts, first canonical image, official/Maps/source links and same PlaceDetail are retained', async ({ page }) => {
  const snapshot = structuredClone(roadContent); snapshot.places[0].imageIds = [snapshot.images[0].id]
  await openContent(page, snapshot, 'attractions')
  const place = snapshot.places[0], card = cards(page).filter({ has: page.getByRole('heading', { name: place.name, exact: true }) })
  await expect(card).toContainText('2小時'); await expect(card).toContainText('09:00'); await expect(card).toContainText('16:30'); await expect(card).toContainText('17:00'); await expect(card).toContainText('USD')
  await expect(card.getByRole('img')).toHaveAttribute('loading', 'lazy')
  await expect(card.getByRole('img')).toHaveAttribute('alt', roadContent.images.find((image) => image.id === place.imageIds[0])!.alt)
  await expect(card.getByRole('link', { name: `官方網站：${place.name}` })).toHaveAttribute('href', place.officialURL!)
  const button = card.getByRole('button', { name: `詳細介紹：${place.name}` })
  await button.click(); const dialog = page.getByRole('dialog')
  await expect(dialog).toHaveClass('place-dialog'); await expect(dialog).toContainText(place.whyVisit!); await expect(dialog).toContainText(place.history!); await expect(dialog).toContainText(place.localImportance!); await expect(dialog).toContainText(place.takeaway!)
  await expect(dialog).toContainText(place.whatToSee![0]); await expect(dialog.getByRole('link', { name: '虛構 POC 資料來源 ↗' })).toHaveAttribute('href', roadContent.sources[0].url)
  const bounds = (await dialog.boundingBox())!, viewport = page.viewportSize()!
  expect(bounds.width).toBeLessThanOrEqual(viewport.width); expect(bounds.height).toBeLessThanOrEqual(viewport.height)
  await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0); await expect(button).toBeFocused()
  await button.click(); await page.getByRole('button', { name: '關閉詳細介紹' }).click(); await expect(dialog).toHaveCount(0); await expect(button).toBeFocused()
})
test('no-image places stay text-only and a broken canonical image falls through without a brand fallback', async ({ page }) => {
  const snapshot = structuredClone(roadContent), place = snapshot.places[0]
  place.imageIds = [snapshot.images[0].id]
  snapshot.images.find((image) => image.id === place.imageIds[0])!.url = 'assets/demo/absent-image.svg'
  await openContent(page, snapshot, 'attractions')
  const card = cards(page).filter({ has: page.getByRole('heading', { name: place.name, exact: true }) })
  await expect(card.getByRole('img')).toHaveCount(0)
  const textOnly = cards(page).filter({ has: page.getByRole('heading', { name: snapshot.places[1].name, exact: true }) })
  await expect(textOnly.getByRole('img')).toHaveCount(0); await expect(textOnly).toContainText(snapshot.places[1].summary)
  await expect(page.locator('.attraction-card img[src*="travelpilot_banner"]')).toHaveCount(0)
})
test('image resolution skips missing or branded records and broken first URL can use the next valid image', async ({ page }) => {
  const snapshot = structuredClone(roadContent), place = snapshot.places[0]
  snapshot.images[0].url = 'assets/demo/not-found.svg'
  place.imageIds = [snapshot.images[0].id, snapshot.images[1].id]
  await openContent(page, snapshot, 'attractions')
  const image = cards(page).filter({ has: page.getByRole('heading', { name: place.name, exact: true }) }).getByRole('img')
  await expect(image).toHaveAttribute('src', `/travelpilot-poc/${snapshot.images[1].url}`)
  await expect(image).toHaveAttribute('alt', snapshot.images[1].alt)
  expect(await image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0)).toBe(true)
})
test('unreferenced Places and unrelated optional entities do not fabricate attraction days/statuses', async ({ page }) => {
  const snapshot = structuredClone(roadContent)
  snapshot.places.push({ ...snapshot.places[0], id: 'unused-canonical', name: '未安排通用場所' })
  for (const day of snapshot.days) { day.timeline = []; day.optionalContent = day.optionalContent.filter((ref) => ref.type !== 'place'); day.backupContent = [] }
  await openContent(page, snapshot, 'attractions')
  await expect(cards(page)).toHaveCount(0); await expect(page.getByRole('heading', { name: '未有行程景點' })).toBeVisible()
  await expect(regionNav(page)).toHaveCount(0); await expect(page.getByText('未安排通用場所', { exact: true })).toHaveCount(0)
})
test('empty filtered result removes quick-nav groups and offers a generic state', async ({ page }) => {
  await page.goto('#/trip/demo-trip/attractions')
  await page.getByRole('button', { name: '備用 0', exact: true }).click()
  await expect(page.getByRole('heading', { name: '此分類未有景點' })).toBeVisible(); await expect(regionNav(page)).toHaveCount(0)
})
test('keyboard region navigation scrolls and focuses the correct canonical heading', async ({ page }) => {
  await page.goto('#/trip/demo-road-trip/attractions')
  const controls = regionNav(page).getByRole('button')
  await controls.first().focus(); await page.keyboard.press('ArrowRight'); await expect(controls.last()).toBeFocused()
  expect(await controls.last().evaluate((node) => getComputedStyle(node).outlineStyle)).not.toBe('none')
  await page.keyboard.press('Enter'); await expect(page.locator('#attraction-region-road-highland')).toBeFocused()
  const y = (await page.locator('#attraction-region-road-highland').boundingBox())!.y
  expect(y).toBeGreaterThanOrEqual((await page.locator('main').boundingBox())!.y)
})
test('overview interactions and navigation reuse one trip load and preserve immutable persisted data', async ({ page }) => {
  const requests: string[] = []
  page.on('request', (request) => { if (/\/rest\/v1\/v2_trip/.test(request.url())) requests.push(`${request.method()} ${new URL(request.url()).pathname}`) })
  await openContent(page, roadContent, 'attractions')
  const before = await cacheContents(page)
  await page.getByRole('button', { name: '可選／Bonus 1' }).click()
  await cards(page).first().getByRole('button', { name: /詳細介紹/ }).click(); await page.keyboard.press('Escape')
  await page.getByRole('navigation', { name: '旅程頁面' }).getByRole('link', { name: 'Live Cam', exact: true }).click()
  await expect(page.getByTestId('live-cam')).toBeVisible()
  await page.getByRole('navigation', { name: '旅程頁面' }).getByRole('link', { name: '詳細行程', exact: true }).click()
  await expect(page.getByTestId('detailed-itinerary')).toBeVisible()
  expect(requests).toEqual(['GET /rest/v1/v2_trips', 'GET /rest/v1/v2_trip_versions']); expect(await cacheContents(page)).toEqual(before)
  await page.route(`${supabaseOrigin}/rest/v1/v2_trips**`, (route) => route.fulfill({ status: 503 }))
  await page.reload(); await expect(page.getByTestId('trip-source')).toContainText('cache')
  expect(await cacheContents(page)).toEqual(before)
})
for (const size of ['small', 'medium', 'large']) test(`Attractions ${size} font remains usable with long text, footer clearance and no overflow`, async ({ page }) => {
  await page.addInitScript((size) => localStorage.setItem('travelpilot.font-size', size), size)
  const snapshot = structuredClone(roadContent)
  snapshot.places[0].name += ' · ' + '通用長名稱'.repeat(12); snapshot.places[0].summary += ' 通用內容'.repeat(40)
  snapshot.regions[0].name += ' · 通用地區名稱'.repeat(6)
  await openContent(page, snapshot, 'attractions')
  await expect(page.locator('html')).toHaveAttribute('data-font-size', size)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  expect(await page.locator('main').evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true)
  expect(await regionNav(page).evaluate((node) => getComputedStyle(node).overflowX)).toBe('auto')
  for (const button of await page.locator('.attraction-filters button, .attraction-card .itinerary-action').all()) {
    expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44)
  }
  await page.locator('main').evaluate((node) => { node.scrollTop = node.scrollHeight })
  const last = (await cards(page).last().boundingBox())!, dock = (await page.locator('.status-dock').boundingBox())!
  expect(last.y + last.height).toBeLessThanOrEqual(dock.y); await expect(page.getByRole('status')).toBeVisible()
  const columns = await page.locator('.attraction-grid').first().evaluate((node) => getComputedStyle(node).gridTemplateColumns.split(' ').length)
  expect(columns).toBe(page.viewportSize()!.width > 700 ? 2 : 1)
})
test('trip switches clear old attraction metadata/filter/detail and Settings Back preserves exact trip', async ({ page }) => {
  await page.goto('#/trip/demo-road-trip/attractions'); await page.getByRole('button', { name: '備用 1' }).click()
  await page.getByRole('navigation', { name: '主導覽' }).getByRole('link', { name: '設定', exact: true }).click()
  await page.getByRole('button', { name: '返回上一頁' }).click(); await expect(page).toHaveURL(/demo-road-trip\/attractions$/)
  await page.evaluate(() => { history.pushState({ key: crypto.randomUUID(), idx: history.state.idx + 1 }, '', '#/trip/demo-trip/attractions'); dispatchEvent(new PopStateEvent('popstate')) })
  await expect(cards(page)).toHaveCount(3); await expect(page.getByTestId('attractions-overview')).not.toContainText(roadContent.places[0].name)
  await expect(page.getByRole('button', { name: '全部 3', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('navigation', { name: '主導覽' }).getByRole('link', { name: '設定', exact: true }).click(); await page.getByRole('button', { name: '返回上一頁' }).click()
  await expect(page).toHaveURL(/demo-trip\/attractions$/); await expect(page.getByTestId('trip-versions')).toContainText('demo.city.5')
  await page.getByRole('navigation', { name: '旅程頁面' }).getByRole('link', { name: '今日模式', exact: true }).click()
  await expect(page.getByRole('heading', { name: '今日模式', level: 1, exact: true })).toBeVisible(); await expect(page.getByTestId('today-mode')).toBeVisible(); await expect(page.getByTestId('attractions-overview')).toHaveCount(0)
  expect(remoteSlug).not.toBe(cityContent.trip.slug)
})
