import type { Page } from '@playwright/test'
import { test, expect, supabaseOrigin } from './fixtures'
import { cityContent, roadContent, seedContentCache } from './contentFixtures'
import { todayFixture, openToday } from './todayFixtures'
import { todayPreviewKey, todayProgressKey } from '../src/app/useTodaySession'
import { remoteId, remoteSlug, cacheContents } from './tripFixtures'
import { formatTripDate } from '../src/data/tripDates'
import { resolveMaps } from '../src/data/itinerary'
import { legacyRoad } from './legacySnapshots'
import schema2Road from './fixtures/schema2-road.json' with { type: 'json' }
import schema3Road from './fixtures/schema3-road.json' with { type: 'json' }
import type { TripSnapshot } from '../src/data/schema/trip'
import { minimalSnapshot } from './minimalSnapshot'

const view = (page: Page) => page.getByTestId('today-mode')
const dayNav = (page: Page) => page.getByRole('navigation', { name: '今日模式行程日期' })
const focus = (page: Page) => page.locator('.today-current')
test('dedicated route and all local canonical activity data are usable signed out without placeholder content', async ({ page }) => {
  for (const snapshot of [cityContent, roadContent]) {
    await page.goto(`#/trip/${snapshot.trip.slug}/today`)
    await expect(view(page)).toBeVisible(); await expect(page.getByRole('heading', { level: 1 })).toHaveText('今日模式')
    await expect(view(page)).not.toContainText('內容準備中')
    await expect(page.getByTestId('trip-versions')).toContainText(snapshot === cityContent ? 'demo.city.5' : 'demo.road.5')
    await expect(page.getByTestId('trip-versions')).toContainText('Trip Schema Version：4')
    await expect(page.locator('.today-activities li h3')).toHaveText(snapshot.days[0].timeline.map((item) => item.title))
    await expect(page.getByRole('status')).toContainText('App Version v2.0.0-poc.16')
  }
})
test('trip timezone drives live date and seconds independently of browser timezone', async ({ page }) => {
  const snapshot = todayFixture(); snapshot.trip.timezone = 'Pacific/Auckland'
  await openToday(page, snapshot, '2025-02-05T23:04:09Z')
  await expect(dayNav(page).getByRole('button', { name: 'D2 · 今日', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.today-clock')).toContainText('06/02/2025 星期四')
  await expect(page.locator('.today-clock strong')).toHaveText('12:04:09')
  await expect(page.locator('.today-clock')).toHaveAttribute('aria-live', 'off')
  await page.clock.runFor(2000); await expect(page.locator('.today-clock strong')).toHaveText('12:04:11')
  expect(await page.evaluate(() => Intl.DateTimeFormat().resolvedOptions().timeZone)).not.toBe('Pacific/Auckland')
})
test('actual matching date wins over remembered preview; preview selection is truthful and remembered per trip', async ({ page }) => {
  const snapshot = todayFixture(), key = todayPreviewKey(remoteId)
  await page.addInitScript(({ key, dayId }) => sessionStorage.setItem(key, dayId), { key, dayId: snapshot.days[3].id })
  await openToday(page, snapshot)
  await expect(view(page)).toHaveAttribute('data-selected-day', snapshot.days[0].id)
  await expect(dayNav(page).getByRole('button', { name: 'D1 · 今日', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await dayNav(page).getByRole('button', { name: 'D3', exact: true }).click()
  await expect(view(page)).toHaveAttribute('data-progress-mode', 'preview'); await expect(page.locator('.today-mode-label')).toHaveText('預覽模式')
  await expect(focus(page)).toContainText('預覽焦點'); await expect(page.locator('.today-delta')).toHaveCount(0)
  expect(await page.evaluate((key) => sessionStorage.getItem(key), key)).toBe(snapshot.days[2].id)
})
for (const remembered of ['valid', 'invalid', 'none'] as const) test(`outside trip dates chooses ${remembered} session preview or first canonical Day`, async ({ page }) => {
  const snapshot = todayFixture(); snapshot.days[0].dayNumber = 12; snapshot.days[1].dayNumber = 9
  if (remembered !== 'none') await page.addInitScript(({ key, id }) => sessionStorage.setItem(key, id), { key: todayPreviewKey(remoteId), id: remembered === 'valid' ? snapshot.days[3].id : 'missing' })
  await openToday(page, snapshot, '2026-10-09T06:00:00Z')
  await expect(view(page)).toHaveAttribute('data-selected-day', snapshot.days[remembered === 'valid' ? 3 : 2].id)
  await expect(view(page)).toHaveAttribute('data-progress-mode', 'preview')
  await expect(dayNav(page).getByRole('button')).toHaveText(['D3', 'D4', 'D9', 'D12'])
})
test('manual next/previous/reset works, includes untimed items, and persists only within trip/day session', async ({ page }) => {
  const snapshot = await openToday(page)
  await expect(focus(page)).toContainText('可選短暫停留')
  await page.getByRole('button', { name: '已到達／下一項 →', exact: true }).click()
  await expect(view(page)).toHaveAttribute('data-progress-mode', 'manual'); await expect(focus(page)).toContainText('手動焦點'); await expect(focus(page)).toContainText('主要計劃目的地')
  const key = todayProgressKey(remoteId, snapshot.days[0].id)
  expect(await page.evaluate((key) => sessionStorage.getItem(key), key)).toBe('today-required')
  await page.getByRole('button', { name: '已到達／下一項 →', exact: true }).click(); await expect(focus(page)).toContainText('未定時間的小休')
  await page.getByRole('button', { name: '← 上一項', exact: true }).click(); await expect(focus(page)).toContainText('主要計劃目的地')
  await page.reload(); await expect(focus(page)).toContainText('主要計劃目的地'); await expect(view(page)).toHaveAttribute('data-progress-mode', 'manual')
  await dayNav(page).getByRole('button', { name: 'D2', exact: true }).click(); await expect(focus(page)).toContainText('開車到步道停車場')
  await dayNav(page).getByRole('button', { name: 'D1 · 今日', exact: true }).click(); await expect(focus(page)).toContainText('主要計劃目的地')
  await page.getByRole('button', { name: '按時間自動', exact: true }).click()
  await expect(view(page)).toHaveAttribute('data-progress-mode', 'auto'); await expect(focus(page)).toContainText('可選短暫停留')
  expect(await page.evaluate((key) => sessionStorage.getItem(key), key)).toBeNull()
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBeNull()
})
test('blocked sessionStorage keeps day/manual controls usable in React memory without leaking errors', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', (error) => errors.push(error.message))
  await page.addInitScript(() => Object.defineProperty(window, 'sessionStorage', { configurable: true, get() { throw new Error('blocked') } }))
  await page.goto('#/trip/demo-road-trip/today'); await expect(view(page)).toBeVisible()
  await dayNav(page).getByRole('button', { name: 'D3', exact: true }).click()
  await page.getByRole('button', { name: '已到達／下一項 →', exact: true }).click()
  await expect(focus(page)).toContainText('可選訪客中心'); await expect(focus(page)).toContainText('預覽焦點')
  await expect(page.locator('.today-mode-label')).toContainText('手動進度')
  await dayNav(page).getByRole('button', { name: 'D1', exact: true }).click(); await dayNav(page).getByRole('button', { name: 'D3', exact: true }).click()
  await expect(focus(page)).toContainText('可選訪客中心'); expect(errors).toEqual([])
})
test('trip switching resets metadata, day, progress, weather context, Hard Cuts and final destination', async ({ page }) => {
  await page.goto('#/trip/demo-road-trip/today'); await expect(view(page)).toBeVisible()
  await dayNav(page).getByRole('button', { name: 'D2', exact: true }).click(); await page.getByRole('button', { name: '已到達／下一項 →', exact: true }).click()
  await expect(page.locator('.today-hard-cuts')).toContainText('示範折返時間')
  await page.evaluate(() => { location.hash = '#/trip/demo-trip/today' })
  await expect(view(page)).toHaveAttribute('data-selected-day', cityContent.days[0].id)
  await expect(focus(page)).toContainText('搭乘示範列車'); await expect(view(page)).not.toContainText('探索示範自然步道')
  await expect(page.locator('.today-hard-cuts')).toHaveCount(0); await expect(page.locator('.today-navigation')).toHaveCount(0); await expect(page.locator('.today-driving')).toHaveCount(0)
  await expect(page.locator('.today-final')).toContainText(cityContent.accommodations[0].name); await expect(view(page)).not.toContainText(roadContent.accommodations[1].name)
})
for (const [time, current, previous, next, end] of [
  ['08:00', null, null, '計劃出發', false], ['09:30', '計劃出發', null, '可選短暫停留', false],
  ['10:05', null, '計劃出發', '可選短暫停留', false], ['16:30', null, '返回當日住宿', null, true],
] as const) test(`planned operational position at ${time} remains truthful`, async ({ page }) => {
  await openToday(page, todayFixture(), `2025-02-05T${time}:00Z`)
  if (current) await expect(focus(page)).toContainText(current); else await expect(focus(page)).toContainText('目前沒有可確定的計劃活動')
  const previousCard = page.getByRole('article', { name: '上一項', exact: true }), nextCard = page.getByRole('article', { name: '下一項', exact: true })
  await expect(previousCard).toContainText(previous ?? '未有上一項'); await expect(nextCard).toContainText(next ?? '未有下一項')
  await expect(page.locator('.today-end')).toHaveCount(end ? 1 : 0)
  if (end) { await expect(page.locator('.today-end')).toHaveText('今日主要行程已到最後一項'); await expect(page.locator('.today-next-stop')).toHaveCount(0); await expect(page.locator('.today-final')).toBeVisible(); await expect(page.locator('.today-activities li')).toHaveCount(5) }
  await expect(view(page)).not.toContainText('已錯過'); await expect(view(page)).not.toContainText('遲到')
})
test('required next stop, canonical parking target, optional/bonus labels, warnings, Maps safety and driving notice render', async ({ page }) => {
  const snapshot = await openToday(page)
  const stop = page.getByRole('region', { name: '下一站', exact: true })
  await expect(stop).toContainText(snapshot.navigationTargets[0].title)
  const maps = stop.getByRole('link', { name: /Google Maps：下一站/ })
  await expect(maps).toHaveAttribute('href', resolveMaps(snapshot.navigationTargets[0])!); await expect(maps).toHaveAttribute('target', '_blank'); await expect(maps).toHaveAttribute('rel', 'noopener noreferrer')
  await expect(page.locator('.today-navigation')).toContainText('泊車'); await expect(page.locator('.today-navigation')).toContainText(snapshot.navigationTargets[0].warning!)
  await expect(focus(page)).toContainText('可選'); await expect(focus(page)).toContainText('Bonus'); await expect(focus(page)).toContainText('虛構可選活動注意事項')
  await expect(page.locator('.today-driving')).toHaveText('駕駛期間請由乘客操作；司機要操作手機請先安全停車。')
  await expect(page.locator('.today-final')).toContainText(snapshot.accommodations[0].name); await expect(page.locator('.today-final')).toContainText(`入住時間：${snapshot.accommodations[0].checkIn}`)
  await expect(page.locator('.today-activities li h3')).toHaveText(snapshot.days[0].timeline.map((item) => item.title))
})
test('optional-only next destination is labelled and unknown/unmapped final data hides cleanly', async ({ page }) => {
  const snapshot = todayFixture(); snapshot.days[0].timeline = [snapshot.days[0].timeline[1]]; delete snapshot.days[0].accommodationId
  await openToday(page, snapshot)
  await expect(page.locator('.today-next-stop .today-tag')).toContainText('可選／Bonus')
  await expect(page.locator('.today-final h2')).toHaveText('今日終點'); await expect(page.locator('.today-driving')).toHaveCount(0)
  await expect(page.locator('.today-navigation')).toHaveCount(0)
})
test('all selected-day canonical and timeline-linked Hard Cuts show chronological labels; preview has no countdown', async ({ page }) => {
  const snapshot = await openToday(page)
  expect(await page.locator('.today-hard-cut').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-cut-id')))).toEqual(['today-cut-early', 'today-cut-linked', 'today-cut-late'])
  await expect(page.locator('.today-cut-state')).toHaveText(['原定時間已過', '即將到達', '尚未到'])
  await expect(page.locator('.today-hard-cuts')).toContainText('嚴重'); await expect(page.locator('.today-hard-cuts')).toContainText('注意'); await expect(page.locator('.today-hard-cuts')).toContainText('提示')
  await expect(page.locator('.today-delta')).toHaveText('原定時間已過 15分鐘')
  await page.clock.setFixedTime(new Date('2026-10-09T10:30:20Z')); await page.reload()
  await expect(view(page)).toHaveAttribute('data-selected-day', snapshot.days[0].id)
  await expect(page.locator('.today-cut-state')).toHaveCount(0); await expect(page.locator('.today-delta')).toHaveCount(0)
})
test('empty day and zero-day snapshots have clean state with no undefined operational cards', async ({ page }) => {
  const snapshot = todayFixture(); snapshot.days[0].timeline = []; delete snapshot.days[0].accommodationId; snapshot.hardCuts = []
  await openToday(page, snapshot)
  await expect(page.locator('.today-activities')).toContainText('此行程日未有活動。'); await expect(page.locator('.today-next-stop,.today-final,.today-hard-cuts')).toHaveCount(0)
  await expect(page.getByRole('button', { name: '已到達／下一項 →', exact: true })).toBeDisabled()
})
test('zero canonical Days is a clean empty Today view rather than an invented day', async ({ page }) => {
  const snapshot = structuredClone(minimalSnapshot); snapshot.days = []
  await openToday(page, snapshot)
  await expect(page.getByRole('heading', { name: '未有行程', exact: true })).toBeVisible()
  await expect(page.locator('.today-clock')).toBeVisible(); await expect(dayNav(page)).toHaveCount(0); await expect(page.locator('.today-progress,.today-next-stop')).toHaveCount(0)
})
test('invalid remembered progress is ignored rather than reusing another trip item', async ({ page }) => {
  const snapshot = todayFixture()
  await page.addInitScript(({ key }) => sessionStorage.setItem(key, 'item-from-another-trip'), { key: todayProgressKey(remoteId, snapshot.days[0].id) })
  await openToday(page, snapshot)
  await expect(view(page)).toHaveAttribute('data-progress-mode', 'auto'); await expect(focus(page)).toContainText('可選短暫停留')
})
test('Settings and shared Back return to exact Today origin with correct trip/day session state', async ({ page }) => {
  for (const snapshot of [cityContent, roadContent]) {
    await page.goto(`#/trip/${snapshot.trip.slug}/today`); await expect(view(page)).toBeVisible()
    await dayNav(page).getByRole('button', { name: 'D2', exact: true }).click()
    await page.getByRole('navigation', { name: '主導覽' }).getByRole('link', { name: '設定', exact: true }).click()
    await page.getByRole('button', { name: '返回上一頁' }).click()
    await expect(page).toHaveURL(new RegExp(`/trip/${snapshot.trip.slug}/today$`)); await expect(view(page)).toHaveAttribute('data-selected-day', snapshot.days[1].id)
  }
})
for (const [version, original] of [[1, legacyRoad], [2, schema2Road], [3, schema3Road], [4, roadContent]] as const) test(`physical Schema ${version} cache renders Today offline without trip writes, upgrades or conversion`, async ({ page }) => {
  const snapshot = structuredClone(original) as TripSnapshot; snapshot.trip.slug = `cached-today-${version}`
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => false })
    const mutations: string[] = []; Object.assign(window, { todayTripMutations: mutations })
    for (const key of ['put', 'add', 'delete', 'clear'] as const) {
      const original = IDBObjectStore.prototype[key]
      Object.defineProperty(IDBObjectStore.prototype, key, { value: function(this: IDBObjectStore, ...args: unknown[]) {
        if (this.transaction.db.name === 'travelpilot-v2-trips') mutations.push(key)
        return Reflect.apply(original, this, args)
      } })
    }
  })
  await seedContentCache(page, snapshot); const before = await cacheContents(page)
  await page.evaluate(() => { (window as unknown as { todayTripMutations: string[] }).todayTripMutations.length = 0 })
  const requests: string[] = []; page.on('request', (request) => { if (request.url().startsWith(supabaseOrigin)) requests.push(request.method() + ' ' + request.url()) })
  await page.context().setOffline(true); await page.evaluate((slug) => { location.hash = `#/trip/${slug}/today` }, snapshot.trip.slug)
  await expect(view(page)).toBeVisible(); await expect(page.getByTestId('trip-source')).toContainText('cache'); await expect(page.getByTestId('trip-versions')).toContainText(`Trip Schema Version：${version}`)
  await expect(page.locator('.today-activities li h3')).toHaveText(snapshot.days[0].timeline.map((item) => item.title))
  await page.getByRole('button', { name: '已到達／下一項 →', exact: true }).click(); await expect(focus(page)).toContainText('預覽焦點')
  await expect(page.getByRole('status')).toContainText('OFFLINE')
  expect(await cacheContents(page)).toEqual(before)
  expect(await page.evaluate(() => (window as unknown as { todayTripMutations: string[] }).todayTripMutations)).toEqual([])
  await page.context().setOffline(false); await page.reload(); await expect(view(page)).toBeVisible(); expect(await cacheContents(page)).toEqual(before)
  expect(requests).toEqual([])
  if (version < 3) await expect(page.getByTestId('today-weather')).toContainText('此旅程資料格式未提供天氣供應商及評分設定。')
})
test('all fonts fit five responsive widths, controls clear the status dock and day navigation stays keyboard usable', async ({ page }) => {
  await openToday(page)
  for (const font of ['small', 'medium', 'large']) {
    await page.evaluate((value) => { document.documentElement.dataset.fontSize = value }, font)
    expect(await page.evaluate(() => document.body.scrollWidth <= innerWidth && document.querySelector('main')!.scrollWidth <= document.querySelector('main')!.clientWidth)).toBe(true)
    const bounds = await page.locator('.today-card,.today-controls button').evaluateAll((nodes) => nodes.map((node) => ({ width: node.getBoundingClientRect().width, right: node.getBoundingClientRect().right })))
    expect(bounds.every((box) => box.width > 0 && box.right <= (page.viewportSize()!.width + 1))).toBe(true)
  }
  const first = dayNav(page).getByRole('button').first(); await first.focus(); await page.keyboard.press('ArrowRight'); await expect(dayNav(page).getByRole('button').nth(1)).toBeFocused()
  const last = page.getByRole('button', { name: '保持螢幕常亮', exact: true }); await last.scrollIntoViewIfNeeded()
  const button = await last.boundingBox(), dock = await page.locator('.status-dock').boundingBox(); expect(button!.y + button!.height).toBeLessThanOrEqual(dock!.y + 1)
  expect(button!.height).toBeGreaterThanOrEqual(44)
  await expect(page.getByRole('status')).toBeVisible()
})
