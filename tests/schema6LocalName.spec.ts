import { test, expect } from './fixtures'
import { roadTrip } from '../src/data/demoTrips/roadTrip'
import { validateTripSnapshot, hasWeatherConfiguration, CURRENT_TRIP_SCHEMA_VERSION, SUPPORTED_TRIP_SCHEMA_VERSIONS } from '../src/data/schema/trip'
import type { Schema6Snapshot } from '../src/data/schema/trip'
import { timingFixture } from './timelineTimingFixtures'
import { dayHasActiveExactTiming, activeExactDay } from '../src/data/operationalTiming'
import { seedAuth, mockRemote, remoteId, remoteSlug, cacheContents } from './tripFixtures'
import { localNameOf } from '../src/data/localNames'

// Fictional test labels are NOT claims about any real Japanese hotel/place.
// Deliberately do not edit production Japan snapshot or POC local fixture.
function schema6Example(): Schema6Snapshot {
  const snapshot = structuredClone(roadTrip) as unknown as Schema6Snapshot
  snapshot.schemaVersion = 6
  snapshot.places[0].localName = '架空の場所（テスト）'
  snapshot.accommodations[0].localName = '架空の宿泊（テスト）'
  snapshot.navigationTargets[0].localName = '架空の入口（テスト）'
  snapshot.transport[0].localName = '架空の交通（テスト）'
  return snapshot
}

test('Schema 6 adds only optional source-authored names and retains exact schema 1–5 readers', () => {
  expect(CURRENT_TRIP_SCHEMA_VERSION).toBe(6)
  expect(SUPPORTED_TRIP_SCHEMA_VERSIONS).toEqual([1, 2, 3, 4, 5, 6])
  const v6 = schema6Example()
  expect(validateTripSnapshot(v6)).toMatchObject({ valid: true, snapshot: v6 })
  expect(hasWeatherConfiguration(v6)).toBe(true)
  expect(localNameOf(v6.places[0])).toBe('架空の場所（テスト）')
  const noNames = structuredClone(v6)
  for (const item of [noNames.places[0], noNames.accommodations[0], noNames.navigationTargets[0], noNames.transport[0]]) delete item.localName
  expect(validateTripSnapshot(noNames)).toMatchObject({ valid: true })
  expect(localNameOf(noNames.places[0])).toBeUndefined()

  // Original strict reader for Schema 4/5 must not suddenly accept a Schema 6-only field.
  const old4 = structuredClone(roadTrip)
  Object.assign(old4.places[0], { localName: 'do not accept' })
  expect(validateTripSnapshot(old4)).toMatchObject({ valid: false, reason: 'invalid-data' })
  const old5 = timingFixture()
  Object.assign(old5.accommodations[0], { localName: 'do not accept' })
  expect(validateTripSnapshot(old5)).toMatchObject({ valid: false, reason: 'invalid-data' })
  expect(validateTripSnapshot(roadTrip)).toMatchObject({ valid: true })

  for (const [collection, idx] of [['places', 0], ['accommodations', 0], ['transport', 0], ['navigationTargets', 0]] as const) {
    for (const invalid of ['', '   ', 42, null, {}]) {
      const bad = structuredClone(v6) as unknown as Record<string, any>
      bad[collection][idx].localName = invalid
      expect(validateTripSnapshot(bad), collection + ':' + JSON.stringify(invalid)).toMatchObject({ valid: false, reason: 'invalid-data' })
    }
  }
  expect(validateTripSnapshot({ ...v6, schemaVersion: 7 })).toMatchObject({ valid: false, reason: 'unsupported-schema' })
})

test('Schema 6 remote source, UI local name, offline cache and truthful data versions', async ({ page }) => {
  const v6 = schema6Example()
  v6.trip = { ...v6.trip, id: remoteId, slug: remoteSlug }
  await seedAuth(page)
  await mockRemote(page, () => ({
    trip_id: remoteId, data_version: 'schema6.localname.qa.1', schema_version: 6,
    status: 'published', is_current: true, payload: v6,
  }))
  await page.goto(`#/trip/${remoteSlug}/itinerary`)
  await expect(page.getByTestId('detailed-itinerary')).toBeVisible()
  await expect(page.getByTestId('trip-versions')).toContainText('Trip Data Version：schema6.localname.qa.1 · Trip Schema Version：6')
  await expect(page.locator('.day-accommodation').first().getByTestId('native-name')).toContainText('架空の宿泊')
  // Road Day 1 has transport and hotel but no Place. Jump to Day 2 to
  // confirm the Japanese name is visibly rendered in an opened Place card.
  await page.getByRole('button', { name: '跳至 DAY 2' }).click()
  const dayTwo = page.locator('.itinerary-day[data-day-id="road-day-2"]')
  await expect(dayTwo).toHaveAttribute('open', '')
  await expect(dayTwo.locator('.place-card').first().getByTestId('native-name')).toContainText('架空の場所')
  const initial = await cacheContents(page)
  expect(initial.versions).toHaveLength(1)
  expect(initial.versions[0]).toMatchObject({ dataVersion: 'schema6.localname.qa.1', schemaVersion: 6, payload: v6 })

  await page.goto(`#/trip/${remoteSlug}/info`)
  await expect(page.locator('.navigation-card').first().getByTestId('native-name')).toContainText('架空の入口')
  await expect(page.locator('.transport-card').first().getByTestId('native-name')).toContainText('架空の交通')
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => false })
  })
  await page.reload()
  await expect(page.getByTestId('trip-source')).toContainText('cache')
  await expect(page.locator('.navigation-card').first().getByTestId('native-name')).toContainText('架空の入口')
  expect(await cacheContents(page)).toEqual(initial)
})

test('legacy Schema 4 UI stays text-only when no localName has been authored', async ({ page }) => {
  await page.goto('#/trip/demo-road-trip/itinerary')
  await expect(page.getByTestId('detailed-itinerary')).toBeVisible()
  await expect(page.getByTestId('native-name')).toHaveCount(0)
})

test('Schema 6 retains Schema 5 exact-time activation and cross-day selection', () => {
  const v6 = { ...timingFixture(), schemaVersion: 6 } as Schema6Snapshot
  const now = new Date('2025-02-05T03:00:00Z')
  expect(validateTripSnapshot(v6).valid).toBe(true)
  expect(dayHasActiveExactTiming(v6, v6.days[0], now)).toBe(true)
  expect(activeExactDay(v6, now)?.id).toBe(v6.days[0].id)
})
