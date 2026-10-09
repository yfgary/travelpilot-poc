import { createHash } from 'node:crypto'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import type { Page } from '@playwright/test'
import { test, expect, testUser, supabaseOrigin } from './fixtures'
import { localTrips } from '../src/data/trips'
import { CURRENT_TRIP_SCHEMA_VERSION, SUPPORTED_TRIP_SCHEMA_VERSIONS, TRIP_SCHEMA_VERSION, validateTripSnapshot, getEmergencyInfo } from '../src/data/schema/trip'
import schema2City from './fixtures/schema2-city.json' with { type: 'json' }
import schema2Road from './fixtures/schema2-road.json' with { type: 'json' }
import type { TripSnapshot, Schema2Snapshot } from '../src/data/schema/trip'
import { emergencyTypes, navigationTypes, formatTransportDateTime, phoneAction, sortedHardCuts, orderedDefinitions } from '../src/data/tripInformation'
import { accommodationTypeLabel, formatMoney, resolveMaps } from '../src/data/itinerary'
import { legacyCity, legacyRoad } from './legacySnapshots'
import { seedAuth, mockRemote, remoteVersion, remoteId, remoteSlug, cacheContents } from './tripFixtures'
import packageMetadata from '../package.json' with { type: 'json' }

const cityRecord = localTrips.find(({ payload }) => payload.trip.slug === 'demo-trip')!
const roadRecord = localTrips.find(({ payload }) => payload.trip.slug === 'demo-road-trip')!
const city = schema2City as Schema2Snapshot, road = schema2Road as Schema2Snapshot
const info = `#/trip/${remoteSlug}/info`
const section = (page: Page, id: string) => page.locator(`.info-${id}`)
function versionFor(snapshot: TripSnapshot, dataVersion = 'information.1', rowVersion = snapshot.schemaVersion as number) {
  const payload = structuredClone(snapshot)
  payload.trip = { ...payload.trip, id: remoteId, slug: remoteSlug, title: '通用資料頁測試旅程' }
  return { ...remoteVersion(), schema_version: rowVersion, data_version: dataVersion, payload }
}
async function openRemote(page: Page, snapshot: TripSnapshot, rowVersion?: number) {
  const version = versionFor(snapshot, 'information.1', rowVersion)
  await seedAuth(page); await mockRemote(page, () => version)
  // The auth init script must run on an existing device page as well as a fresh tab.
  if (page.url() !== 'about:blank') await page.reload()
  await page.goto(info)
  return version
}
async function openLocal(page: Page, snapshot = road) {
  await page.goto(`#/trip/${snapshot.trip.slug}/info`)
  await expect(page.getByTestId('trip-information')).toBeVisible()
}
async function seedOldCache(page: Page) {
  await page.goto('#/')
  const version = versionFor(legacyRoad, 'pre-step10.1')
  const record = { tripId: remoteId, slug: remoteSlug, ownerId: testUser.id, dataVersion: version.data_version, schemaVersion: 1, payload: version.payload, cachedAt: '2026-10-07T12:00:00Z' }
  // Use the original Step 6–9 physical IndexedDB stores and record format,
  // not the new cache writer. This simulates an existing installed device.
  await page.evaluate(async (record) => {
    const request = indexedDB.open('travelpilot-v2-trips', 1)
    request.onupgradeneeded = () => {
      const db = request.result
      db.createObjectStore('versions', { keyPath: ['tripId', 'dataVersion'] })
      db.createObjectStore('current', { keyPath: ['slug', 'ownerId'] })
      db.createObjectStore('deviceCurrent', { keyPath: 'slug' })
    }
    const db = await new Promise<IDBDatabase>((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error) })
    const pointer = { tripId: record.tripId, slug: record.slug, ownerId: record.ownerId, dataVersion: record.dataVersion }
    const tx = db.transaction(['versions', 'current', 'deviceCurrent'], 'readwrite')
    tx.objectStore('versions').put(record); tx.objectStore('current').put(pointer); tx.objectStore('deviceCurrent').put(pointer)
    await new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error) })
    db.close()
  }, record)
  return record
}

test('current 5 supports frozen 1 and 2 and existing 4 without changing source versions', () => {
  expect(CURRENT_TRIP_SCHEMA_VERSION).toBe(5); expect(TRIP_SCHEMA_VERSION).toBe(5)
  expect(SUPPORTED_TRIP_SCHEMA_VERSIONS).toEqual([1, 2, 3, 4, 5])
  for (const snapshot of [legacyCity, legacyRoad, city, road, cityRecord.payload, roadRecord.payload]) {
    const result = validateTripSnapshot(snapshot)
    expect(result).toMatchObject({ valid: true, snapshot: { schemaVersion: snapshot.schemaVersion } })
    if (result.valid) expect(result.snapshot).toEqual(snapshot)
  }
  expect(getEmergencyInfo(legacyCity)).toBeUndefined(); expect(getEmergencyInfo(city)).toEqual(city.emergency)
  for (const schemaVersion of [0, 6, 7, '2', null]) expect(validateTripSnapshot({ ...city, schemaVersion })).toMatchObject({ valid: false, reason: 'unsupported-schema' })
  expect(packageMetadata.version).toMatch(/^2\.0\.0-poc\.\d+$/)
  expect(cityRecord.dataVersion).toBe('demo.city.5'); expect(roadRecord.dataVersion).toBe('demo.road.5')
})

test('both contracts remain strict; malformed emergency records return structured issues', () => {
  for (const snapshot of [legacyCity, city]) {
    for (const bad of [{ ...snapshot, places: null }, { ...snapshot, extra: true }, { ...snapshot, trip: { ...snapshot.trip, endDate: '2030-02-30' } }]) {
      const result = validateTripSnapshot(bad); expect(result.valid).toBe(false)
      if (!result.valid) expect(result.issues.length).toBeGreaterThan(0)
    }
  }
  for (const emergency of [undefined, {}, null, { ...city.emergency, contacts: 'wrong' }, { ...city.emergency, contacts: [{ ...city.emergency.contacts[0], type: 'country-specific' }] }]) {
    const result = validateTripSnapshot({ ...city, emergency }); expect(result).toMatchObject({ valid: false, reason: 'invalid-data' })
    if (!result.valid) expect(result.issues.some((issue) => issue.path[0] === 'emergency')).toBe(true)
  }
  expect(validateTripSnapshot({ ...legacyCity, emergency: city.emergency }).valid).toBe(false)
  expect(validateTripSnapshot({ ...legacyCity, sources: [{ ...legacyCity.sources[0], entity: { type: 'emergencyContact', id: 'missing' } }] }).valid).toBe(false)
})

test('emergency stable IDs, region/source/entity references and HTTP-only URLs are validated', () => {
  const mutations: ((s: Schema2Snapshot) => void)[] = [
    (s) => s.emergency.contacts.push(structuredClone(s.emergency.contacts[0])),
    (s) => { s.emergency.contacts[0].id = s.regions[0].id },
    (s) => { s.emergency.contacts[0].id = 'invalid id' },
    (s) => { s.emergency.contacts[0].regionId = 'missing' },
    (s) => { s.emergency.contacts[0].sourceIds = ['missing'] },
    (s) => { s.emergency.contacts[0].url = 'javascript:alert(1)' },
    (s) => { s.emergency.contacts[0].url = 'ftp://example.invalid/file' },
    (s) => { s.sources.find((source) => source.entity?.type === 'emergencyContact')!.entity!.id = 'missing' },
  ]
  for (const mutate of mutations) {
    const snapshot = structuredClone(city); mutate(snapshot)
    const result = validateTripSnapshot(snapshot); expect(result).toMatchObject({ valid: false, reason: 'invalid-data' })
    if (!result.valid) for (const issue of result.issues) { expect(issue.path).toBeInstanceOf(Array); expect(issue.message).toBeTruthy() }
  }
  const snapshot = structuredClone(city)
  snapshot.days[0].optionalContent = [{ type: 'emergencyContact', id: snapshot.emergency.contacts[0].id }]
  expect(validateTripSnapshot(snapshot).valid).toBe(true)
})

for (const snapshot of [legacyRoad, road]) {
  test(`remote Schema ${snapshot.schemaVersion} loads with its actual source version`, async ({ page }) => {
    const version = await openRemote(page, snapshot)
    await expect(page.getByTestId('trip-information')).toBeVisible()
    await expect(page.getByTestId('trip-source')).toContainText('remote')
    await expect(page.getByTestId('trip-versions')).toContainText(`Trip Schema Version：${snapshot.schemaVersion}`)
    await expect(section(page, 'emergency')).toHaveCount(snapshot.schemaVersion === 2 ? 1 : 0)
    const cache = await cacheContents(page)
    expect(cache.versions[0]).toMatchObject({ schemaVersion: snapshot.schemaVersion, payload: version.payload, dataVersion: 'information.1' })
  })
}
for (const [snapshot, rowVersion] of [[city, 1], [legacyCity, 2]] as const) {
  test(`row ${rowVersion} / payload ${snapshot.schemaVersion} mismatch is invalid and never cached`, async ({ page }) => {
    await openRemote(page, snapshot, rowVersion)
    await expect(page.getByRole('heading', { name: '旅程資料未能通過驗證' })).toBeVisible()
    expect((await cacheContents(page)).versions).toEqual([])
  })
}
test('future Schema 6 remote row/payload is rejected cleanly', async ({ page }) => {
  await seedAuth(page)
  const version = versionFor(city, 'future.6', 6)
  await mockRemote(page, () => ({ ...version, payload: { ...version.payload, schemaVersion: 6 } }))
  await page.goto(info); await expect(page.getByRole('heading', { name: '未支援此旅程資料格式' })).toBeVisible()
  expect((await cacheContents(page)).versions).toEqual([])
})

test('genuine old V1 cache renders itinerary/info signed out without rewrites or deletion', async ({ page }) => {
  const record = await seedOldCache(page), before = await cacheContents(page)
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => false })
    const put = IDBObjectStore.prototype.put
    ;(window as unknown as { cacheWrites: number }).cacheWrites = 0
    IDBObjectStore.prototype.put = function (...args) {
      ;(window as unknown as { cacheWrites: number }).cacheWrites++
      return put.apply(this, args)
    }
  })
  await page.goto(`#/trip/${remoteSlug}/itinerary`)
  await expect(page.getByTestId('detailed-itinerary')).toBeVisible()
  await expect(page.getByTestId('trip-source')).toContainText('cache')
  await expect(page.getByTestId('trip-versions')).toContainText('Trip Schema Version：1')
  await expect(page.locator('.itinerary-day')).toHaveCount(record.payload.days.length)
  await page.getByRole('navigation', { name: '旅程頁面' }).getByRole('link', { name: '旅程資料', exact: true }).click()
  await expect(page.getByTestId('trip-information')).toBeVisible()
  for (const id of ['car', 'accommodation', 'navigation', 'hard-cuts', 'checklists']) await expect(section(page, id)).toBeVisible()
  await expect(section(page, 'emergency')).toHaveCount(0)
  await page.reload(); await expect(page.getByTestId('trip-information')).toBeVisible()
  expect(await cacheContents(page)).toEqual(before)
  expect(await page.evaluate(() => (window as unknown as { cacheWrites: number }).cacheWrites)).toBe(0)
  expect(await page.evaluate(async () => (await indexedDB.databases()).find((db) => db.name === 'travelpilot-v2-trips')?.version)).toBe(1)
})

test('V1 and V2 versions coexist; V2 reload/offline fallback retains source metadata and old record', async ({ page }) => {
  const old = await seedOldCache(page)
  await openRemote(page, road)
  await expect(page.getByTestId('trip-source')).toContainText('remote')
  const cache = await cacheContents(page)
  expect(cache.versions).toHaveLength(2); expect(cache.versions).toContainEqual(old)
  const current = cache.versions.find((r) => (r as { schemaVersion: number }).schemaVersion === 2)
  expect(current).toMatchObject({ dataVersion: 'information.1', schemaVersion: 2 })
  await page.addInitScript(() => Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => false }))
  await page.reload(); await expect(page.getByTestId('trip-source')).toContainText('cache')
  await expect(page.getByTestId('trip-versions')).toContainText('Trip Schema Version：2')
  await expect(section(page, 'emergency')).toContainText(road.emergency.contacts[1].title)
  expect(await cacheContents(page)).toEqual(cache)
})

test('invalid Schema 2 update preserves and falls back to the old valid Schema 1 cache', async ({ page }) => {
  const old = await seedOldCache(page), before = await cacheContents(page)
  const malformed = structuredClone(road); malformed.emergency.contacts[0].regionId = 'missing'
  await openRemote(page, malformed)
  await expect(page.getByTestId('trip-source')).toContainText('cache')
  await expect(page.getByTestId('trip-versions')).toContainText('Trip Schema Version：1')
  await expect(section(page, 'emergency')).toHaveCount(0)
  expect(await cacheContents(page)).toEqual(before); expect(before.versions).toEqual([old])
})

test('cache metadata/payload schema mismatch is rejected without deleting the old record', async ({ page }) => {
  await seedOldCache(page)
  await page.evaluate(async () => {
    const request = indexedDB.open('travelpilot-v2-trips', 1)
    const db = await new Promise<IDBDatabase>((resolve) => { request.onsuccess = () => resolve(request.result) })
    const tx = db.transaction('versions', 'readwrite'), store = tx.objectStore('versions'), get = store.getAll()
    get.onsuccess = () => store.put({ ...get.result[0], schemaVersion: 2 })
    await new Promise<void>((resolve) => { tx.oncomplete = () => resolve() }); db.close()
  })
  const before = await cacheContents(page)
  await page.goto(info); await expect(page.getByRole('heading', { name: '找不到旅程' })).toBeVisible()
  expect(await cacheContents(page)).toEqual(before)
})

for (const snapshot of [city, road]) {
  test(`${snapshot.trip.slug} canonical information sections and quick navigation match available data`, async ({ page }) => {
    await openLocal(page, snapshot)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('旅程資料')
    const ids = snapshot === city ? ['transport', 'accommodation', 'checklists', 'emergency'] : ['car', 'accommodation', 'navigation', 'hard-cuts', 'checklists', 'emergency']
    expect(await page.locator('.info-section > h2').evaluateAll((headings) => headings.map((h) => h.id))).toEqual(ids.map((id) => `trip-info-${id}`))
    const nav = page.getByRole('navigation', { name: '旅程資料章節' })
    await expect(nav.getByRole('button')).toHaveCount(ids.length)
    for (let i = 0; i < ids.length; i++) {
      const button = nav.getByRole('button').nth(i)
      await expect(button).toHaveAttribute('aria-controls', `trip-info-${ids[i]}`)
      await button.focus(); await button.press('Enter')
      await expect(page.locator(`#trip-info-${ids[i]}`)).toBeFocused()
      const headingBox = (await page.locator(`#trip-info-${ids[i]}`).boundingBox())!, navBox = (await nav.boundingBox())!
      expect(headingBox.y).toBeGreaterThanOrEqual(navBox.y + navBox.height - 1)
    }
    await expect(page.getByTestId('trip-versions')).toContainText(snapshot === city ? 'demo.city.5' : 'demo.road.5')
    await expect(page.getByTestId('trip-versions')).toContainText('Trip Schema Version：4')
    await expect(page.getByRole('status')).toContainText(`App Version v${packageMetadata.version}`)
  })
}

test('public transport uses canonical provider/service, zoned timings, booking, price and safe Maps', async ({ page }) => {
  await openLocal(page, city)
  const transport = city.transport[0], card = section(page, 'transport').locator('.transport-card').first()
  for (const value of [transport.provider, transport.service, transport.origin, transport.destination, transport.bookingState, transport.paymentState, formatMoney(transport.price), ...transport.notes, ...transport.warnings]) if (value) await expect(card).toContainText(value)
  await expect(card).toContainText('12/04/2030 星期五 09:00'); await expect(card).toContainText('12/04/2030 星期五 09:20')
  await expect(card).not.toContainText('2030-04-12T')
  await expect(card.getByRole('link', { name: `Google Maps：${transport.service}` })).toHaveAttribute('href', transport.mapURL!)
  const minimal = section(page, 'transport').locator('.transport-card').last()
  for (const label of ['出發', '抵達', '付款', '價格']) await expect(minimal.getByText(label, { exact: true })).toHaveCount(0)
  await expect(minimal.getByRole('link')).toHaveCount(0)
  await expect(section(page, 'car')).toHaveCount(0)
})

test('all generic non-car types and transport timezone display work without destination assumptions', async ({ page }) => {
  expect(formatTransportDateTime('2030-04-12T23:30:00Z', 'Pacific/Kiritimati')).toBe('13/04/2030 星期六 13:30')
  expect(formatTransportDateTime(undefined, 'Etc/UTC')).toBeUndefined()
  const snapshot = structuredClone(city); snapshot.trip.timezone = 'Pacific/Kiritimati'
  snapshot.transport = (['flight', 'train', 'bus', 'ferry', 'taxi', 'walk', 'other'] as const).map((type) => ({ id: `generic-${type}`, type, origin: '示範起點', destination: '示範終點', departure: '2030-04-12T23:30:00Z', arrival: '2030-04-13T00:00:00Z', navigationTargetIds: [], notes: [], warnings: [] }))
  for (const day of snapshot.days) day.timeline = []
  await openRemote(page, snapshot); await expect(page.getByTestId('trip-information')).toBeVisible()
  await expect(section(page, 'transport').locator('.entity-kicker')).toHaveText(['↗ 航班', '↗ 鐵路', '↗ 巴士', '↗ 渡輪', '↗ 的士', '↗ 步行', '↗ 交通'])
  await expect(section(page, 'transport')).toContainText('13/04/2030 星期六 13:30')
})

test('self-drive and rich accommodations reuse canonical cards; city omits unsupported sections', async ({ page }) => {
  await openLocal(page)
  const car = section(page, 'car'), record = road.transport[0]
  for (const text of [record.provider, record.service, record.bookingState, record.paymentState, formatMoney(record.price), ...record.notes, ...record.warnings]) if (text) await expect(car).toContainText(text)
  await expect(car.getByRole('link')).toHaveAttribute('href', resolveMaps(road.navigationTargets[0])!)
  await expect(section(page, 'transport')).toHaveCount(0)
  const hotels = section(page, 'accommodation')
  await expect(hotels.getByTestId('accommodation-card')).toHaveCount(road.accommodations.length)
  for (const stay of road.accommodations) {
    const card = hotels.locator(`[data-entity-id="${stay.id}"]`)
    for (const text of [stay.name, accommodationTypeLabel(stay.type), stay.room, stay.mealPlan, stay.address, stay.phone, stay.paymentState, formatMoney(stay.total), formatMoney(stay.paid), formatMoney(stay.arrivalPayment), stay.cancellation, stay.parking, stay.checkIn, stay.checkOut]) if (text) await expect(card).toContainText(text)
    await expect(card.getByRole('link')).toHaveAttribute('href', stay.mapURL!)
  }
  await openLocal(page, city)
  for (const id of ['car', 'navigation', 'hard-cuts']) await expect(section(page, id)).toHaveCount(0)
  for (const label of ['付款狀態', '總價', '已付', '到店支付']) await expect(section(page, 'accommodation').getByText(label, { exact: true })).toHaveCount(0)
})

test('all navigation target types retain their separate place/Maps relationship', async ({ page }) => {
  const snapshot = structuredClone(city)
  snapshot.navigationTargets = Object.keys(navigationTypes).map((type, i) => ({ id: `target-${i}`, type: type as keyof typeof navigationTypes, title: `導航目標 ${i}`, placeId: snapshot.places[0].id, mapQuery: `Fictional target ${i}`, description: '不同於場所入口的指定導航位置', warning: '虛構長警告，請核對指定目標。' }))
  await openRemote(page, snapshot); await expect(page.getByTestId('trip-information')).toBeVisible()
  const nav = section(page, 'navigation')
  await expect(nav.locator('.navigation-groups h3')).toHaveText(Object.values(navigationTypes))
  for (const target of snapshot.navigationTargets) {
    await expect(nav.getByRole('link', { name: `Google Maps：${target.title}` })).toHaveAttribute('href', resolveMaps(target)!)
    await expect(nav).toContainText(target.warning!)
  }
  await expect(nav).toContainText(`相關場所：${snapshot.places[0].name}`)
})

test('full-trip Hard Cuts sort actual datetimes and linked day/time generically, with deterministic fallback', async ({ page }) => {
  const snapshot = structuredClone(city); snapshot.trip.timezone = 'Pacific/Kiritimati'
  const base = { severity: 'warning' as const, priority: 1, description: '虛構限制', sourceId: snapshot.sources[0].id }
  snapshot.hardCuts = [
    { ...base, id: 'undated-z', time: '01:00', title: '無日期 Z' },
    { ...base, id: 'late-date', datetime: '2030-04-12T23:30:00Z', title: '實際時間 C' },
    { ...base, id: 'local-early', dayId: snapshot.days[1].id, time: '08:00', title: '本地時間 A' },
    { ...base, id: 'mid-date', datetime: '2030-04-12T22:00:00Z', title: '實際時間 B' },
    { ...base, id: 'undated-a', time: '23:00', title: '無日期 A' },
  ]
  const before = structuredClone(snapshot)
  expect(sortedHardCuts(snapshot).map((c) => c.id)).toEqual(['local-early', 'mid-date', 'late-date', 'undated-a', 'undated-z'])
  expect(snapshot).toEqual(before)
  await openRemote(page, snapshot); await expect(page.getByTestId('trip-information')).toBeVisible()
  expect(await section(page, 'hard-cuts').locator('[data-cut-id]').evaluateAll((els) => els.map((el) => el.getAttribute('data-cut-id')))).toEqual(sortedHardCuts(snapshot).map((c) => c.id))
  await expect(section(page, 'hard-cuts')).toContainText('DAY 2 · 13/04/2030 星期六')
  await expect(section(page, 'hard-cuts')).toContainText('Hard Cut · 注意')
  await expect(section(page, 'hard-cuts').getByRole('link').first()).toHaveAttribute('href', snapshot.sources[0].url)
})

test('checklists, groups and items sort order values without mutating source definitions', async ({ page }) => {
  const snapshot = structuredClone(city)
  snapshot.checklists = [2, 0, 1].map((order) => ({ id: `list-${order}`, type: 'generic', title: `清單 ${order}`, description: '清單說明', order, notes: ['清單注意'], groups: [1, 0].map((order2) => ({ id: `group-${order}-${order2}`, title: `群組 ${order2}`, order: order2, notes: ['群組注意'], items: [2, 0, 1].map((order3) => ({ id: `item-${order}-${order2}-${order3}`, label: `項目 ${order3}`, order: order3, notes: ['項目注意'] })) })) }))
  const before = structuredClone(snapshot)
  expect(orderedDefinitions(snapshot.checklists).map((l) => l.id)).toEqual(['list-0', 'list-1', 'list-2'])
  expect(snapshot).toEqual(before)
  await openRemote(page, snapshot); await expect(page.getByTestId('trip-information')).toBeVisible()
  await expect(section(page, 'checklists').locator('.checklist-definition > h3')).toHaveText(['清單 0', '清單 1', '清單 2'])
  for (const list of await section(page, 'checklists').locator('.checklist-definition').all()) {
    await expect(list.locator('.checklist-group h4')).toHaveText(['群組 0', '群組 1'])
    for (const group of await list.locator('.checklist-group').all()) await expect(group.locator(':scope > ul > li > label > span')).toHaveText(['項目 0', '項目 1', '項目 2'])
    await expect(list).toContainText('清單注意'); await expect(list).toContainText('群組注意'); await expect(list).toContainText('項目注意')
  }
})

test('definitions remain immutable while local demo controls create no backend or checklist localStorage writes', async ({ page }) => {
  const requests: string[] = []
  page.on('request', (request) => { if (request.url().startsWith(supabaseOrigin)) requests.push(request.method() + ' ' + new URL(request.url()).pathname) })
  await page.goto('#/')
  const stored = () => page.evaluate(() => Object.fromEntries(Object.entries(localStorage)))
  const before = await stored()
  for (const snapshot of [city, road]) {
    await openLocal(page, snapshot)
    await expect(section(page, 'checklists')).toContainText(snapshot.checklists[0].title)
    await expect(section(page, 'checklists').getByRole('checkbox')).toHaveCount(snapshot.checklists.flatMap((list) => list.groups.flatMap((group) => group.items)).length)
    for (const group of snapshot.checklists[0].groups) for (const item of group.items) await expect(section(page, 'checklists')).toContainText(item.label)
  }
  expect(await stored()).toEqual(before)
  expect(requests.filter((request) => /checklist/i.test(request))).toEqual([])
  expect(requests.filter((request) => !request.startsWith('GET '))).toEqual([])
})

test('emergency contacts/categories/regions/phones/notes/source links come only from canonical data', async ({ page }) => {
  for (const snapshot of [city, road]) {
    await openLocal(page, snapshot)
    const emergency = section(page, 'emergency')
    await expect(emergency).toContainText(snapshot.emergency.description!)
    for (const contact of snapshot.emergency.contacts) {
      const card = emergency.locator(`[data-contact-id="${contact.id}"]`)
      for (const text of [emergencyTypes[contact.type], contact.title, contact.phone, contact.description, contact.availability, ...contact.notes]) if (text) await expect(card).toContainText(text)
      await expect(card).toContainText(snapshot.regions.find((r) => r.id === contact.regionId)!.name)
      await expect(card.locator('.emergency-phone a')).toHaveAttribute('href', phoneAction(contact.phone)!)
      for (const id of contact.sourceIds) {
        const source = snapshot.sources.find((s) => s.id === id)!
        await expect(card.getByRole('link', { name: `資料來源：${source.title}` })).toHaveAttribute('href', source.url)
      }
    }
    for (const link of await emergency.locator('a[target]').all()) await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  }
})

test('all emergency categories and optional fields/unsafe phone actions are generic', async ({ page }) => {
  expect(phoneAction(' +000 (123) 456-7890 ')).toBe('tel:+0001234567890')
  for (const phone of [undefined, '', 'javascript:alert(1)', 'tel:555', '未知', '+']) expect(phoneAction(phone)).toBeUndefined()
  const snapshot = structuredClone(city)
  snapshot.sources = snapshot.sources.filter((source) => source.entity?.type !== 'emergencyContact')
  snapshot.emergency = { notes: [], contacts: Object.keys(emergencyTypes).map((type, i) => ({ id: `contact-${i}`, type: type as keyof typeof emergencyTypes, title: `支援 ${i}`, notes: [], sourceIds: [] })) }
  snapshot.emergency.contacts[0].phone = '依文件確認'
  await openRemote(page, snapshot); await expect(page.getByTestId('trip-information')).toBeVisible()
  await expect(section(page, 'emergency').locator('.contact-category')).toHaveText(Object.values(emergencyTypes).map((type) => `☎ ${type}`))
  await expect(section(page, 'emergency').locator('.emergency-phone')).toHaveText('依文件確認')
  await expect(section(page, 'emergency').getByRole('link')).toHaveCount(0)
})

test('no optional data yields a compact summary without fake empty sections or quick links', async ({ page }) => {
  const snapshot = structuredClone(city)
  snapshot.days = []; snapshot.transport = []; snapshot.accommodations = []; snapshot.navigationTargets = []; snapshot.hardCuts = []; snapshot.checklists = []
  snapshot.sources = snapshot.sources.filter((source) => source.entity?.type !== 'emergencyContact')
  snapshot.emergency = { contacts: [], notes: [] }
  await openRemote(page, snapshot); await expect(page.getByTestId('trip-information')).toBeVisible()
  await expect(page.locator('.info-section')).toHaveCount(0)
  await expect(page.getByRole('navigation', { name: '旅程資料章節' })).toHaveCount(0)
  await expect(page.getByTestId('trip-information')).not.toContainText('沒有資料')
})

test('only the shared boundary loads across info, itinerary and the remaining placeholders', async ({ page }) => {
  await seedAuth(page); await mockRemote(page, () => versionFor(road))
  const requests: string[] = []
  page.on('request', (request) => { if (/\/rest\/v1\/v2_trip/.test(request.url())) requests.push(request.method() + ' ' + new URL(request.url()).pathname) })
  await page.goto(info); await expect(page.getByTestId('trip-information')).toBeVisible()
  await page.getByRole('navigation', { name: '旅程資料章節' }).getByRole('button', { name: '緊急', exact: true }).click()
  await page.getByRole('navigation', { name: '旅程頁面' }).getByRole('link', { name: '詳細行程', exact: true }).click()
  await expect(page.getByTestId('detailed-itinerary')).toBeVisible()
  for (const name of ['景點總覽', 'Live Cam', '今日模式']) {
    await page.getByRole('navigation', { name: '旅程頁面' }).getByRole('link', { name, exact: true }).click()
    if (name === '景點總覽') await expect(page.getByTestId('attractions-overview')).toBeVisible()
    else if (name === 'Live Cam') await expect(page.getByTestId('live-cam')).toBeVisible()
    else await expect(page.getByTestId('today-mode')).toBeVisible()
  }
  await page.getByRole('navigation', { name: '旅程頁面' }).getByRole('link', { name: '旅程資料', exact: true }).click()
  await expect(page.getByTestId('trip-information')).toBeVisible()
  expect(requests).toEqual(['GET /rest/v1/v2_trips', 'GET /rest/v1/v2_trip_versions'])
})

test('both trip information pages retain exact Settings Back and isolate contacts/content', async ({ page }) => {
  for (const snapshot of [city, road]) {
    const other = snapshot === city ? road : city
    await openLocal(page, snapshot)
    await expect(page.getByTestId('trip-information')).not.toContainText(other.emergency.contacts[0].title)
    await page.getByRole('navigation', { name: '主導覽' }).getByRole('link', { name: '設定', exact: true }).click()
    await page.getByRole('button', { name: '返回上一頁' }).click()
    await expect(page).toHaveURL(new RegExp(`#/trip/${snapshot.trip.slug}/info$`))
    await expect(section(page, 'emergency')).toContainText(snapshot.emergency.contacts[0].title)
  }
})

for (const snapshot of [city, road]) {
  test(`${snapshot.trip.slug} all font sizes/cards/quick nav and bottom fit`, async ({ page }) => {
    for (const font of ['小', '中', '大']) {
      await page.goto('#/settings'); await page.getByRole('radio', { name: font, exact: true }).check()
      await openLocal(page, snapshot)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      expect(await page.locator('main').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
      const nav = page.getByRole('navigation', { name: '旅程資料章節' })
      for (const button of await nav.getByRole('button').all()) {
        const box = (await button.boundingBox())!; expect(box.height).toBeGreaterThanOrEqual(44)
      }
      for (const card of await page.locator('.info-section .entity-card, .emergency-card, .checklist-group').all()) {
        expect(await card.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
      }
      for (const action of await page.locator('.trip-info-page .itinerary-action, .emergency-phone a').all()) expect((await action.boundingBox())!.height).toBeGreaterThanOrEqual(44)
      await page.locator('main').evaluate((el) => { el.scrollTop = el.scrollHeight })
      const bottom = (await section(page, 'emergency').boundingBox())!, dock = (await page.locator('.status-dock').boundingBox())!
      expect(bottom.y + bottom.height).toBeLessThanOrEqual(dock.y)
      await expect(page.getByRole('status')).toBeVisible()
    }
  })
}

test('long operator names, warnings and emergency contacts wrap at every width', async ({ page }) => {
  const snapshot = structuredClone(road)
  snapshot.transport[0].provider = '虛構長服務商名稱'.repeat(20)
  snapshot.transport[0].service = 'FictionalOperatorService'.repeat(20)
  snapshot.navigationTargets[0].warning = '虛構長警告資料，請核對指定停車位置。'.repeat(20)
  snapshot.emergency.contacts[0].phone = '+000 000 000 000 000 000 000 000'
  snapshot.emergency.contacts[0].title = '虛構長服務名稱'.repeat(20)
  await openRemote(page, snapshot); await expect(page.getByTestId('trip-information')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  expect(await page.locator('main').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
})

test('source audit forbids content child IO and destination/default emergency code; clearing is explicit', () => {
  const files = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? files(join(dir, entry.name)) : [join(dir, entry.name)])
  for (const path of ['src/views/TripInformation.tsx', ...files('src/components/tripInfo'), 'src/data/tripInformation.ts']) {
    const source = readFileSync(path, 'utf8')
    expect(source).not.toMatch(/loadTrip\(|supabase|indexedDB|localStorage|readCachedTrip|v2_checklist_state|DEFAULT_TRIP|hydrate|Japan|Nagoya|Shirakawa|Takayama|Bangkok|Hokkaido|demo-trip|demo-road-trip|\b(?:110|119|112|911|999)\b|Times/)
  }
  expect(readFileSync('src/views/TripInformation.tsx', 'utf8')).toContain('useLoadedTrip()')
  const cacheSource = readFileSync('src/offline/tripCache.ts', 'utf8')
  expect(cacheSource.slice(0, cacheSource.indexOf('export async function clearTripCache'))).not.toMatch(/deleteDatabase|deleteObjectStore|clear\(/)
  expect(cacheSource).not.toMatch(/deleteDatabase|deleteObjectStore/)
  for (const asset of ['travelpilot_banner.PNG', 'travelpilot_icon.PNG']) expect(createHash('sha256').update(readFileSync(`assets/images/${asset}`)).digest('hex')).toBe(createHash('sha256').update(readFileSync(`dist/assets/images/${asset}`)).digest('hex'))
})

for (const snapshot of [city, road]) {
  test(`visual QA ${snapshot.trip.slug} information sections`, async ({ page }) => {
    if (page.viewportSize()!.width === 320 && snapshot === road) {
      await page.goto('#/settings'); await page.getByRole('radio', { name: '大', exact: true }).check()
    }
    await openLocal(page, snapshot)
    await page.locator('.brand img').evaluateAll((images) => Promise.all(images.map((img) => (img as HTMLImageElement).decode())))
    await page.screenshot({ path: test.info().outputPath('intro.png') })
    for (const id of snapshot === city ? ['transport', 'accommodation', 'checklists', 'emergency'] : ['car', 'accommodation', 'navigation', 'hard-cuts', 'checklists', 'emergency']) {
      await section(page, id).evaluate((el) => el.scrollIntoView({ block: 'start' }))
      await page.screenshot({ path: test.info().outputPath(`${id}.png`) })
    }
    await page.locator('main').evaluate((el) => { el.scrollTop = el.scrollHeight })
    await page.screenshot({ path: test.info().outputPath('bottom.png') })
  })
}
