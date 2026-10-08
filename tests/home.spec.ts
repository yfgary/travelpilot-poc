import { test, expect } from './fixtures'
import { localTrips } from '../src/data/trips'
import { orderTrips } from '../src/data/tripDates'
import { resolveTripCover, nextUpcomingSlug, tripBadgeLabel, tripShortcuts } from '../src/data/tripPresentation'
import { RECENT_TRIP_KEY } from '../src/app/useRecentTrip'
import { pageHref } from '../src/app/pages'
import { renderCards } from './homeHarness'

const city = localTrips.find(({ payload }) => payload.trip.slug === 'demo-trip')!.payload
const road = localTrips.find(({ payload }) => payload.trip.slug === 'demo-road-trip')!.payload
const cardFor = (page: import('@playwright/test').Page, title: string) => page.getByRole('article').filter({ has: page.getByRole('heading', { name: title, exact: true }) })

test('Home brand hero, icon, MY TRIPS hierarchy and abstract covers stay separate', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-08T12:00:00Z') })
  await page.goto('#/')
  await expect(page.locator('.home-banner')).toHaveAttribute('src', '/travelpilot-poc/assets/images/travelpilot_banner.PNG')
  await expect(page.locator('.brand img')).toHaveAttribute('src', '/travelpilot-poc/assets/images/travelpilot_icon.PNG')
  await expect(page.getByText('MY TRIPS', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: '我的旅程', exact: true })).toBeVisible()
  await expect(page.getByText('2 個旅程', { exact: true })).toBeVisible()
  await expect(page.locator('.trip-cover-fallback')).toHaveCount(2)
  await expect(page.locator('.trip-cover img')).toHaveCount(0)
  for (const payload of [city, road]) {
    const card = cardFor(page, payload.trip.title)
    await expect(card).toContainText(payload.trip.destinationLabel)
    await expect(card).toContainText(payload.trip.summary)
    await expect(card).toContainText('示範資料')
    await expect(card).toContainText('非目的地示意設計')
    expect(await card.locator('.trip-cover').evaluate((el) => getComputedStyle(el).backgroundImage)).not.toContain('travelpilot_banner')
  }
  await expect(cardFor(page, city.trip.title).getByTestId('trip-status')).toHaveText('下一趟旅程')
  await expect(cardFor(page, road.trip.title).getByTestId('trip-status')).toHaveText('旅程已完成')
  await expect(page.getByRole('button', { name: '返回上一頁' })).toHaveCount(0)
})

test('generic cover priority, broken references and brand-image exclusion preserve metadata', () => {
  const snapshot = structuredClone(city)
  snapshot.images = [
    { id: 'hero', url: 'https://example.invalid/representative.jpg', alt: '測試封面', attribution: '示範來源', licenseNote: '測試授權', sourceURL: 'https://example.invalid/source' },
    { id: 'banner', url: 'assets/test-cover.jpg', alt: '備用封面' },
  ]
  snapshot.trip.heroImageId = 'hero'; snapshot.trip.bannerImageId = 'banner'
  expect(resolveTripCover(snapshot)).toEqual(snapshot.images[0])
  snapshot.trip.heroImageId = 'missing'
  expect(resolveTripCover(snapshot, '/travelpilot-poc/')).toEqual({ ...snapshot.images[1], url: '/travelpilot-poc/assets/test-cover.jpg' })
  snapshot.trip.bannerImageId = 'missing'
  expect(resolveTripCover(snapshot)).toBeNull()
  for (const url of ['assets/images/travelpilot_banner.PNG', 'https://example.invalid/assets/images/travelpilot_banner.PNG?v=1', 'assets/images/travelpilot_%62anner.PNG']) {
    snapshot.images[0].url = url; snapshot.trip.heroImageId = 'hero'
    expect(resolveTripCover(snapshot)).toBeNull()
  }
})

test('nearest upcoming selection is date-driven for one and many unsorted trips', () => {
  const records = [
    { ...city.trip, slug: 'later', startDate: '2035-05-01', endDate: '2035-05-03' },
    { ...city.trip, slug: 'nearer', startDate: '2035-04-01', endDate: '2035-04-03' },
    { ...city.trip, slug: 'current', startDate: '2035-03-01', endDate: '2035-03-03' },
    { ...city.trip, slug: 'completed', startDate: '2034-01-01', endDate: '2034-01-03' },
  ]
  const before = structuredClone(records)
  const ordered = orderTrips(records, new Date('2035-03-02T12:00:00Z'))
  expect(nextUpcomingSlug(ordered)).toBe('nearer')
  expect(ordered.map(({ trip, status }) => tripBadgeLabel(status, trip.slug === nextUpcomingSlug(ordered)))).toEqual(['旅程進行中', '下一趟旅程', '未出發', '旅程已完成'])
  expect(nextUpcomingSlug(orderTrips([records[1]], new Date('2035-03-02T12:00:00Z')))).toBe('nearer')
  expect(nextUpcomingSlug(orderTrips([], new Date()))).toBeUndefined()
  expect(records).toEqual(before)
})

test('every capability-based Home shortcut uses the shared hash route without duplicate card activation', async ({ page }) => {
  for (const payload of [city, road]) {
    for (const shortcut of tripShortcuts(payload)) {
      await page.goto('#/')
      const card = cardFor(page, payload.trip.title)
      const label = shortcut.id === 'attractions' ? '景點' : shortcut.title
      const link = card.getByRole('link', { name: label, exact: true })
      await expect(link).toHaveAttribute('href', `#${pageHref(shortcut, payload.trip.slug)}`)
      await link.click()
      await expect(page).toHaveURL(new RegExp(`#/trip/${payload.trip.slug}/${shortcut.path}$`))
      await expect(page.getByRole('heading', { level: 1, name: shortcut.title, exact: true })).toBeVisible()
      expect(await page.evaluate((key) => localStorage.getItem(key), RECENT_TRIP_KEY)).toBe(payload.trip.slug)
      await page.getByRole('button', { name: '返回上一頁' }).click()
      await expect(page).toHaveURL(/#\/$/)
    }
  }
  await expect(cardFor(page, city.trip.title).getByRole('link', { name: 'Live Cam', exact: true })).toHaveCount(0)
  await expect(cardFor(page, road.trip.title).getByRole('link', { name: 'Live Cam', exact: true })).toBeVisible()
  const empty = structuredClone(city); empty.places = []; empty.liveCams = []
  expect(tripShortcuts(empty).map((page) => page.id)).toEqual(['itinerary', 'info', 'today'])
})

test('recent use replaces the matching badge, persists and does not reorder cards', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-08T12:00:00Z') })
  for (const payload of [city, road]) {
    await page.goto('#/')
    await cardFor(page, payload.trip.title).getByRole('link', { name: '詳細行程', exact: true }).click()
    await page.getByRole('navigation', { name: '主導覽' }).getByRole('link', { name: '首頁', exact: true }).click()
    await page.reload()
    await expect(page.getByText('最近使用', { exact: true })).toHaveCount(1)
    await expect(cardFor(page, payload.trip.title)).toContainText('最近使用')
    await expect(page.getByRole('article').locator('h3')).toHaveText([city.trip.title, road.trip.title])
    await expect(cardFor(page, payload.trip.title).getByTestId('trip-status')).toHaveText(payload === city ? '下一趟旅程' : '旅程已完成')
  }
})

test('blocked recent preference storage keeps cards and shortcuts usable', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new Error('Blocked') }
    Storage.prototype.setItem = () => { throw new Error('Blocked') }
  })
  const errors: string[] = []; page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('#/')
  await cardFor(page, road.trip.title).getByRole('link', { name: '旅程資料', exact: true }).click()
  await expect(page.locator('code')).toHaveText(road.trip.slug)
  await page.getByRole('button', { name: '返回上一頁' }).click()
  await expect(page.getByRole('article')).toHaveCount(2)
  expect(errors).toEqual([])
})

for (const key of ['Enter', 'Space']) {
  test(`card surface opens by keyboard ${key} and stores recent use`, async ({ page }) => {
    await page.goto('#/')
    const surface = cardFor(page, city.trip.title).getByRole('link', { name: `開啟 ${city.trip.title}`, exact: true })
    await surface.focus()
    await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab')
    await expect(surface).toBeFocused()
    await expect(surface).toHaveCSS('outline-width', '3px')
    await page.keyboard.press(key)
    await expect(page).toHaveURL(/#\/trip\/demo-trip\/itinerary$/)
    await expect(page.locator('code')).toHaveText(city.trip.slug)
    expect(await page.evaluate((key) => localStorage.getItem(key), RECENT_TRIP_KEY)).toBe(city.trip.slug)
  })
}

test('Home grid, sticky header, badges and all font sizes fit and controls clear the status footer', async ({ page }) => {
  for (const label of ['小', '中', '大']) {
    await page.goto('#/settings'); await page.getByRole('radio', { name: label, exact: true }).check()
    await page.getByRole('navigation', { name: '主導覽' }).getByRole('link', { name: '首頁', exact: true }).click()
    expect(await page.locator('.trip-list').evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length)).toBe(page.viewportSize()!.width <= 700 ? 1 : 2)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    expect(await page.locator('main').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
    await expect(page.locator('.app-header')).toHaveCSS('position', 'sticky')
    const headerBefore = (await page.locator('.app-header').boundingBox())!
    await page.locator('main').evaluate((el) => { el.scrollTop = el.scrollHeight })
    expect((await page.locator('.app-header').boundingBox())!.y).toBe(headerBefore.y)
    const dock = (await page.locator('.status-dock').boundingBox())!
    for (const card of await page.getByRole('article').all()) {
      const cover = (await card.getByTestId('trip-cover').boundingBox())!
      const caption = (await card.locator('.cover-caption').boundingBox())!
      const badges = (await card.locator('.trip-badges').boundingBox())!
      expect(badges.y + badges.height).toBeLessThan(caption.y)
      expect(badges.x).toBeGreaterThanOrEqual(cover.x)
      expect(badges.x + badges.width).toBeLessThanOrEqual(cover.x + cover.width + 1)
      for (const link of await card.locator('.trip-shortcut').all()) {
        const box = (await link.boundingBox())!
        expect(box.height).toBeGreaterThanOrEqual(44)
        expect(box.x).toBeGreaterThanOrEqual(0)
        expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize()!.width)
        if (box.y >= headerBefore.y + headerBefore.height) expect(box.y + box.height).toBeLessThanOrEqual(dock.y)
      }
    }
    await expect(page.getByRole('status')).toBeVisible()
  }
})

test('actual card component handles broken images and one/many-card grids without nested links', async ({ page }) => {
  const snapshot = structuredClone(city)
  snapshot.trip.heroImageId = 'photo'
  snapshot.images = [{ id: 'photo', url: 'https://example.invalid/test-cover.jpg', alt: '通用測試封面' }]
  await page.route('https://example.invalid/test-cover.jpg', (route) => route.fulfill({ status: 404 }))
  await renderCards(page, [snapshot])
  await expect(page.locator('.trip-cover-fallback')).toHaveCount(1)
  await expect(page.locator('.trip-cover img')).toHaveCount(0)
  await expect(page.locator('a a')).toHaveCount(0)
  await page.getByRole('link', { name: '旅程資料', exact: true }).click()
  expect(await page.evaluate(() => (window as unknown as { openedSlugs: string[] }).openedSlugs)).toEqual([city.trip.slug])
  const many = Array.from({ length: 5 }, (_, i) => ({ ...structuredClone(city), trip: { ...city.trip, id: `test-${i}`, slug: `test-${i}`, title: `通用測試旅程 ${i}` } }))
  await renderCards(page, many)
  await expect(page.getByRole('article')).toHaveCount(5)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  expect(await page.locator('.trip-list').evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length)).toBe(page.viewportSize()!.width <= 700 ? 1 : 2)
})

test('visual QA captures hero and full trip panel including wrapped shortcuts and recent badge', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-08T12:00:00Z') })
  await page.goto('#/')
  await page.evaluate(({ key, slug }) => localStorage.setItem(key, slug), { key: RECENT_TRIP_KEY, slug: road.trip.slug })
  await page.reload()
  await page.locator('.home-banner, .brand img').evaluateAll((images) => Promise.all(images.map((image) => (image as HTMLImageElement).decode())))
  await page.locator('main').evaluate((el) => { el.scrollTop = 0 })
  await page.screenshot({ path: test.info().outputPath('home-hero.png') })
  await cardFor(page, city.trip.title).scrollIntoViewIfNeeded()
  await page.screenshot({ path: test.info().outputPath('home-city.png') })
  await page.locator('main').evaluate((el) => { el.scrollTop = el.scrollHeight })
  await page.screenshot({ path: test.info().outputPath('home-road.png') })
  if (page.viewportSize()!.width === 320) {
    await page.goto('#/settings'); await page.getByRole('radio', { name: '大', exact: true }).check()
    await page.getByRole('navigation', { name: '主導覽' }).getByRole('link', { name: '首頁', exact: true }).click()
    await page.screenshot({ path: test.info().outputPath('home-large-hero.png') })
    await cardFor(page, city.trip.title).scrollIntoViewIfNeeded()
    await page.screenshot({ path: test.info().outputPath('home-large-city.png') })
    await page.locator('main').evaluate((el) => { el.scrollTop = el.scrollHeight })
    await page.screenshot({ path: test.info().outputPath('home-large-road.png') })
  }
})
