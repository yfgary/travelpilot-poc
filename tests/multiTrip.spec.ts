import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Page } from '@playwright/test'
import { test, expect, supabaseOrigin, testUser } from './fixtures'
import { localTrips, trips } from '../src/data/trips'
import { validateTripSnapshot } from '../src/data/schema/trip'
import { loadTrip } from '../src/services/trips'
import { calendarDate, tripStatus, tripStatusLabels, orderTrips, formatTripDate } from '../src/data/tripDates'
import { tripPages } from '../src/app/pages'
import { seedAuth, cacheContents } from './tripFixtures'
import { remoteTrips, mockRemoteTrips } from './multiTripFixtures'

async function changeTrip(page: Page, slug: string, view = 'info') {
  // Model a router-managed entry (distinct key), rather than an unmanaged hash edit.
  // Home-card and shared navigation clicks are exercised separately below.
  await page.evaluate((path) => {
    history.pushState({ usr: null, key: crypto.randomUUID(), idx: (history.state?.idx ?? 0) + 1 }, '', `#${path}`)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }, `/trip/${slug}/${view}`)
  await expect(page).toHaveURL(new RegExp(`#/trip/${slug}/${view}$`))
}
async function checkTrip(page: Page, payload: (typeof localTrips)[number]['payload'], version: string, source: string) {
  await expect(page.locator('.trip-heading h2')).toHaveText(payload.trip.title)
  await expect(page.locator('.trip-heading')).toContainText(payload.trip.summary)
  await expect(page.locator('code')).toHaveText(payload.trip.slug)
  await expect(page.getByTestId('trip-versions')).toHaveText(`Trip Data Version：${version} · Trip Schema Version：${payload.schemaVersion}`)
  await expect(page.getByTestId('trip-source')).toHaveText(`POC 資料來源：${source}`)
}

test('two structurally different snapshots validate and load without shared mutation or network', async () => {
  expect(localTrips.map(({ payload }) => payload.trip.slug)).toEqual(['demo-road-trip', 'demo-trip'])
  const city = localTrips.find(({ payload }) => payload.trip.slug === 'demo-trip')!.payload
  const road = localTrips.find(({ payload }) => payload.trip.slug === 'demo-road-trip')!.payload
  expect(city.regions).toHaveLength(1); expect(city.days).toHaveLength(3); expect(city.accommodations).toHaveLength(1)
  expect(city.transport.map((ride) => ride.type)).toEqual(['train', 'walk'])
  expect(city.places.map((place) => place.type)).toEqual(['attraction', 'food', 'shopping'])
  for (const key of ['liveCams', 'hardCuts', 'navigationTargets'] as const) expect(city[key]).toHaveLength(0)
  expect(road.days).toHaveLength(4); expect(road.regions.length).toBeGreaterThanOrEqual(2)
  expect(road.accommodations.length).toBeGreaterThanOrEqual(2)
  expect(road.transport[0].type).toBe('car')
  expect(road.navigationTargets[0].type).toBe('parking')
  expect(road.hardCuts.length).toBeGreaterThan(0)
  expect(road.days.some((day) => day.backupContent.length && day.timeline.length)).toBe(true)
  expect(road.days.some((day) => day.optionalContent.length)).toBe(true)
  expect(road.checklists[0].groups.length).toBeGreaterThan(1)
  expect(road.liveCams[0].sourceURL).toBe('https://example.invalid/road-cam')
  function objects(value: unknown, seen = new Set<object>()): Set<object> {
    if (value && typeof value === 'object') {
      seen.add(value)
      for (const child of Object.values(value)) objects(child, seen)
    }
    return seen
  }
  const roadObjects = objects(road)
  expect([...objects(city)].some((object) => roadObjects.has(object))).toBe(false)
  const before = structuredClone(localTrips)
  for (const record of localTrips) {
    expect(validateTripSnapshot(record.payload).valid).toBe(true)
    const result = await loadTrip(record.payload.trip.slug, { userId: null, signal: new AbortController().signal, online: false })
    expect(result).toMatchObject({ state: 'loaded', source: 'demo', schemaVersion: 4, dataVersion: record.dataVersion, snapshot: record.payload })
    if (result.state === 'loaded') { result.snapshot.trip.title = 'mutated'; result.snapshot.days[0].timeline[0].title = 'mutated' }
  }
  expect(localTrips).toEqual(before)
})

test('generic status has inclusive boundaries, timezone calendar dates and deterministic non-mutating sorting', () => {
  const dates = { startDate: '2032-05-10', endDate: '2032-05-12' }
  expect(tripStatus(dates, '2032-05-09')).toBe('upcoming')
  for (const today of ['2032-05-10', '2032-05-11', '2032-05-12']) expect(tripStatus(dates, today)).toBe('current')
  expect(tripStatus(dates, '2032-05-13')).toBe('completed')
  expect(calendarDate(new Date('2032-05-10T00:30:00Z'), 'America/Los_Angeles')).toBe('2032-05-09')
  expect(calendarDate(new Date('2032-05-09T23:30:00Z'), 'Asia/Tokyo')).toBe('2032-05-10')
  const sample = [
    ['past-old', '2032-01-01', '2032-01-02'], ['future-far', '2032-07-01', '2032-07-02'],
    ['future-b', '2032-06-01', '2032-06-02'], ['present', '2032-05-10', '2032-05-12'],
    ['past-recent', '2032-05-01', '2032-05-09'], ['future-a', '2032-06-01', '2032-06-02'],
  ].map(([slug, startDate, endDate]) => ({ slug, startDate, endDate, timezone: 'Etc/UTC' }))
  const before = structuredClone(sample)
  expect(orderTrips(sample, new Date('2032-05-11T12:00:00Z')).map(({ trip }) => trip.slug)).toEqual(['present', 'future-a', 'future-b', 'future-far', 'past-recent', 'past-old'])
  expect(sample).toEqual(before)
  expect(formatTripDate('2030-04-12')).toBe('12/04/2030 星期五')
})

for (const now of ['2025-02-06', '2026-10-07', '2030-04-12', '2030-04-14', '2030-04-15']) {
  test(`Home dates and sorting use current date ${now}, not fixture array order`, async ({ page }) => {
    const date = new Date(`${now}T12:00:00Z`)
    await page.clock.install({ time: date })
    await page.goto('#/')
    const cards = page.getByRole('article')
    const ordered = orderTrips(trips, date)
    await expect(cards).toHaveCount(2)
    await expect(cards.locator('h3')).toHaveText(ordered.map(({ trip }) => trip.title))
    expect(ordered.map(({ trip }) => trip.slug)).toEqual(now === '2025-02-06' ? ['demo-road-trip', 'demo-trip'] : ['demo-trip', 'demo-road-trip'])
    if (now !== '2025-02-06') expect(ordered.map(({ trip }) => trip.slug)).not.toEqual(trips.map((trip) => trip.slug))
    for (let i = 0; i < ordered.length; i++) {
      const { trip, status } = ordered[i], card = cards.nth(i)
      await expect(card).toContainText(trip.destinationLabel)
      await expect(card.getByTestId('trip-status')).toHaveText(status === 'upcoming' ? '下一趟旅程' : tripStatusLabels[status])
      await expect(card.locator('time')).toHaveText([formatTripDate(trip.startDate), formatTripDate(trip.endDate)])
      await expect(card.locator('time').first()).toHaveAttribute('datetime', trip.startDate)
      await expect(card).toContainText('示範資料')
      await expect(card.getByRole('link', { name: '詳細行程', exact: true })).toHaveAttribute('href', `#/trip/${trip.slug}/itinerary`)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await expect(page.getByRole('button', { name: '返回上一頁' })).toHaveCount(0)
  })
}

for (const record of localTrips) {
  test(`all five shared routes, reloads and Settings Back work for ${record.payload.trip.slug}`, async ({ page }) => {
    const other = localTrips.find((trip) => trip !== record)!
    await page.goto('#/')
    await page.getByRole('article').filter({ hasText: record.payload.trip.title }).getByRole('link', { name: '詳細行程', exact: true }).click()
    for (const view of tripPages) {
      await page.getByRole('navigation', { name: '旅程頁面' }).getByRole('link', { name: view.title, exact: true }).click()
      await checkTrip(page, record.payload, record.dataVersion, 'demo')
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(view.title)
      await expect(page.getByText(other.payload.trip.title, { exact: true })).toHaveCount(0)
      await expect(page.getByRole('navigation', { name: '旅程頁面' }).getByRole('link')).toHaveText(tripPages.map((view) => view.title))
      await page.reload()
      await checkTrip(page, record.payload, record.dataVersion, 'demo')
      await expect(page.getByRole('status')).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      await page.getByRole('navigation', { name: '主導覽' }).getByRole('link', { name: '設定' }).click()
      await page.getByRole('button', { name: '返回上一頁' }).click()
      await expect(page).toHaveURL(new RegExp(`#/trip/${record.payload.trip.slug}/${view.path}$`))
    }
  })
}

test('local slug switching and Back preserve exact originating trip without metadata leakage', async ({ page }) => {
  await page.goto('#/trip/demo-trip/info')
  for (const slug of ['demo-road-trip', 'demo-trip', 'demo-road-trip']) {
    await changeTrip(page, slug)
    const record = localTrips.find((record) => record.payload.trip.slug === slug)!
    await checkTrip(page, record.payload, record.dataVersion, 'demo')
    const other = localTrips.find((record) => record.payload.trip.slug !== slug)!
    await expect(page.locator('.trip-heading')).not.toContainText(other.payload.trip.title)
    await expect(page.locator('.trip-heading')).not.toContainText(other.dataVersion)
  }
  await page.getByRole('navigation', { name: '主導覽' }).getByRole('link', { name: '設定' }).click()
  await page.reload()
  await page.getByRole('button', { name: '返回上一頁' }).click()
  await expect(page).toHaveURL(/#\/trip\/demo-road-trip\/info$/)
  await page.getByRole('button', { name: '返回上一頁' }).click()
  await expect(page).toHaveURL(/#\/trip\/demo-trip\/info$/)
  await page.goto('#/trip/unknown-third-trip/info')
  await expect(page.getByRole('heading', { name: '找不到旅程' })).toBeVisible()
  await expect(page.locator('.trip-heading')).toHaveCount(0)
})

test('two remote slugs query independently, persist separate versions and return correct offline/signed-out caches', async ({ page, context }) => {
  await seedAuth(page)
  const records = remoteTrips(), requests = await mockRemoteTrips(page, records)
  await page.goto(`#/trip/${records[0].slug}/info`)
  for (const record of records) {
    await changeTrip(page, record.slug)
    await checkTrip(page, record.payload, record.dataVersion, 'remote')
    const other = records.find((other) => other !== record)!
    await expect(page.locator('.trip-heading')).not.toContainText(other.title)
    await expect(page.locator('.trip-heading')).not.toContainText(other.dataVersion)
    await page.getByRole('navigation', { name: '主導覽' }).getByRole('link', { name: '設定' }).click()
    await page.getByRole('button', { name: '返回上一頁' }).click()
    await expect(page).toHaveURL(new RegExp(`#/trip/${record.slug}/info$`))
    await checkTrip(page, record.payload, record.dataVersion, 'remote')
  }
  const before = await cacheContents(page)
  expect(before.versions).toHaveLength(2); expect(before.pointers).toHaveLength(2); expect(before.device).toHaveLength(2)
  for (const record of records) {
    expect(before.versions).toContainEqual(expect.objectContaining({ tripId: record.id, slug: record.slug, dataVersion: record.dataVersion, payload: record.payload }))
    expect(before.pointers).toContainEqual(expect.objectContaining({ tripId: record.id, slug: record.slug, dataVersion: record.dataVersion }))
    expect(requests).toContainEqual({ table: 'v2_trips', slug: record.slug })
    expect(requests).toContainEqual({ table: 'v2_trip_versions', slug: record.slug })
  }
  await changeTrip(page, 'unknown-third-trip')
  await expect(page.getByRole('heading', { name: '找不到旅程' })).toBeVisible()
  await expect(page.locator('.trip-heading')).toHaveCount(0)
  expect(await cacheContents(page)).toEqual(before)
  await page.route(`${supabaseOrigin}/rest/v1/v2_trips**`, (route) => route.fulfill({ status: 503, json: {} }))
  for (const record of records) { await changeTrip(page, record.slug); await checkTrip(page, record.payload, record.dataVersion, 'cache') }
  await page.route(`${supabaseOrigin}/auth/v1/logout**`, (route) => route.fulfill({ status: 204 }))
  await page.getByRole('navigation', { name: '主導覽' }).getByRole('link', { name: '設定' }).click()
  await page.getByRole('button', { name: '登出', exact: true }).click()
  await expect(page.getByRole('button', { name: '登入', exact: true })).toBeVisible()
  await context.setOffline(true)
  const count = requests.length
  for (const record of records) { await changeTrip(page, record.slug); await checkTrip(page, record.payload, record.dataVersion, 'cache') }
  expect(requests).toHaveLength(count)
  expect(await cacheContents(page)).toEqual(before)
  await changeTrip(page, 'unknown-third-trip')
  await expect(page.getByRole('heading', { name: '暫時未能載入旅程' })).toBeVisible()
  await expect(page.locator('.trip-heading')).toHaveCount(0)
})

test('invalid remote B cannot contaminate A or overwrite either validated cache', async ({ page }) => {
  await seedAuth(page)
  const records = remoteTrips()
  await mockRemoteTrips(page, records)
  await page.goto(`#/trip/${records[0].slug}/info`)
  await checkTrip(page, records[0].payload, records[0].dataVersion, 'remote')
  const cityOnly = await cacheContents(page)
  const validRoad = structuredClone(records[1])
  records[1].payload.days[0].timeline[0].placeId = 'missing-place'
  await changeTrip(page, records[1].slug)
  await expect(page.getByRole('heading', { name: '旅程資料未能通過驗證' })).toBeVisible()
  expect(await cacheContents(page)).toEqual(cityOnly)
  records[1] = structuredClone(validRoad)
  await page.reload()
  await checkTrip(page, validRoad.payload, validRoad.dataVersion, 'remote')
  const both = await cacheContents(page)
  records[1].payload.days[0].timeline[0].placeId = 'missing-place'
  records[1].dataVersion = 'road.invalid.2'
  await page.reload()
  await checkTrip(page, validRoad.payload, validRoad.dataVersion, 'cache')
  expect(await cacheContents(page)).toEqual(both)
  await changeTrip(page, records[0].slug)
  await checkTrip(page, records[0].payload, records[0].dataVersion, 'remote')
})

test('late remote city response cannot replace the road trip during a slug transition', async ({ page }) => {
  await seedAuth(page)
  const records = remoteTrips()
  await mockRemoteTrips(page, records)
  let release!: () => void
  const gate = new Promise<void>((resolve) => { release = resolve })
  await page.route(`${supabaseOrigin}/rest/v1/v2_trips**`, async (route) => {
    if (new URL(route.request().url()).searchParams.get('slug') !== `eq.${records[0].slug}`) return route.fallback()
    await gate
    await route.fulfill({ json: [{ id: records[0].id, slug: records[0].slug, owner_id: testUser.id }] })
  })
  await page.goto(`#/trip/${records[0].slug}/info`)
  await expect(page.getByRole('heading', { name: '正在載入旅程' })).toBeVisible()
  await expect(page.locator('.trip-heading')).toHaveCount(0)
  await changeTrip(page, records[1].slug)
  await checkTrip(page, records[1].payload, records[1].dataVersion, 'remote')
  release()
  // Wait for the aborted city handler to finish before checking the stable road metadata.
  await page.getByRole('navigation', { name: '旅程頁面' }).getByRole('link', { name: '詳細行程' }).click()
  await checkTrip(page, records[1].payload, records[1].dataVersion, 'remote')
  await expect(page.locator('.trip-heading')).not.toContainText(records[0].title)
  expect((await cacheContents(page)).versions).toHaveLength(1)
})

test('a forged cache pointer cannot return another slug snapshot', async ({ page }) => {
  await seedAuth(page)
  const records = remoteTrips()
  await mockRemoteTrips(page, records)
  await page.goto(`#/trip/${records[0].slug}/info`)
  await checkTrip(page, records[0].payload, records[0].dataVersion, 'remote')
  await changeTrip(page, records[1].slug)
  await checkTrip(page, records[1].payload, records[1].dataVersion, 'remote')
  await page.evaluate(async ({ city, road }) => {
    const open = indexedDB.open('travelpilot-v2-trips', 1)
    const db = await new Promise<IDBDatabase>((resolve) => { open.onsuccess = () => resolve(open.result) })
    const tx = db.transaction(['current', 'deviceCurrent'], 'readwrite')
    for (const name of ['current', 'deviceCurrent']) {
      const store = tx.objectStore(name), request = store.getAll()
      request.onsuccess = () => {
        const pointer = request.result.find((pointer) => pointer.slug === city.slug)
        store.put({ ...pointer, tripId: road.id, dataVersion: road.dataVersion })
      }
    }
    await new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error) })
    db.close()
  }, { city: records[0], road: records[1] })
  await page.route(`${supabaseOrigin}/rest/v1/v2_trips**`, (route) => route.fulfill({ status: 503, json: {} }))
  await changeTrip(page, records[0].slug)
  await expect(page.getByRole('heading', { name: '暫時未能載入旅程' })).toBeVisible()
  await expect(page.locator('.trip-heading')).toHaveCount(0)
  await changeTrip(page, records[1].slug)
  await checkTrip(page, records[1].payload, records[1].dataVersion, 'cache')
})

test('core application contains no fixture identities or destination-specific branching', () => {
  function files(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? files(join(dir, entry.name)) : [join(dir, entry.name)])
  }
  for (const path of files('src').filter((path) => /\.(tsx?|css)$/.test(path) && !path.startsWith('src/data/demoTrips/'))) {
    const source = readFileSync(path, 'utf8')
    expect(source, path).not.toMatch(/demo-road-trip|demo-trip|城市週末示範旅程|山區自駕示範旅程|虛構都會|虛構山區/)
    expect(source, path).not.toMatch(/(?:if\s*\(|case\s+)[^\n]*(?:japan|shirakawa|takayama|nagoya|bangkok|hokkaido|country\s*===|dayNumber\s*===|placeId\s*===)/i)
  }
  const workflow = readFileSync('.github/workflows/pages.yml', 'utf8')
  expect(workflow.match(/github\.repository == 'yfgary\/travelpilot-poc'/g)).toHaveLength(2)
  expect(workflow).toContain('needs: build')
})
