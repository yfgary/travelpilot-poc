import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Page } from '@playwright/test'
import { test, expect, supabaseOrigin } from './fixtures'
import { localTrips } from '../src/data/trips'
import { validateTripSnapshot } from '../src/data/schema/trip'
import type { TripSnapshot } from '../src/data/schema/trip'
import { formatDuration, formatMoney, resolveMaps, initialDayId, hardCutTime, entityLabel, dayHardCuts } from '../src/data/itinerary'
import { formatTripDate } from '../src/data/tripDates'
import { resolveContentImage } from '../src/data/images'
import { seedAuth, mockRemote, remoteVersion, remoteId, remoteSlug, cacheContents } from './tripFixtures'
import { renderGallery } from './itineraryHarness'
import packageMetadata from '../package.json' with { type: 'json' }

const cityRecord = localTrips.find(({ payload }) => payload.trip.slug === 'demo-trip')!
const roadRecord = localTrips.find(({ payload }) => payload.trip.slug === 'demo-road-trip')!
const city = cityRecord.payload, road = roadRecord.payload
const dayFor = (page: Page, id: string) => page.locator(`details[data-day-id="${id}"]`)
async function openDay(page: Page, number: number) {
  await page.getByRole('button', { name: `跳至 DAY ${number}`, exact: true }).click()
  await expect(page.locator('.itinerary-day > summary').filter({ hasText: `DAY ${number}` })).toBeFocused()
}
async function loadCustom(page: Page, original: TripSnapshot) {
  const payload = structuredClone(original)
  payload.trip = { ...payload.trip, id: remoteId, slug: remoteSlug, title: '通用測試行程' }
  expect(validateTripSnapshot(payload).valid).toBe(true)
  await seedAuth(page)
  await mockRemote(page, () => ({ ...remoteVersion(), schema_version: payload.schemaVersion, payload }))
  await page.goto(`#/trip/${remoteSlug}/itinerary`)
  await expect(page.getByTestId('detailed-itinerary')).toBeVisible()
  return payload
}

test('current Schema Version and independent App/Data Versions remain canonical', () => {
  expect(packageMetadata.version).toBe('2.0.0-poc.15')
  expect(cityRecord.dataVersion).toBe('demo.city.5'); expect(roadRecord.dataVersion).toBe('demo.road.5')
  for (const record of localTrips) expect(validateTripSnapshot(record.payload)).toMatchObject({ valid: true, snapshot: { schemaVersion: 4 } })
  expect(city.hardCuts).toEqual([]); expect(city.liveCams).toEqual([]); expect(city.navigationTargets).toEqual([])
})

test('generic duration, money, Maps priority and timezone formatters', () => {
  expect([15, 60, 90, 120, 0].map(formatDuration)).toEqual(['15分鐘', '1小時', '1小時30分鐘', '2小時', '0分鐘'])
  expect(formatDuration(undefined)).toBeUndefined(); expect(formatMoney(undefined)).toBeUndefined()
  for (const currency of ['JPY', 'HKD', 'USD', 'EUR']) {
    expect(formatMoney({ amount: 1234, currency, notes: '測試' })).toContain(currency)
    expect(formatMoney({ amount: 1234, currency, notes: '測試' })).toContain('測試')
  }
  expect(resolveMaps({ mapURL: 'https://example.invalid/maps', mapQuery: 'ignored', coordinates: { latitude: 0, longitude: 0 } })).toBe('https://example.invalid/maps')
  expect(resolveMaps({ mapQuery: 'Fictional entrance + 1' })).toBe('https://www.google.com/maps/search/?api=1&query=Fictional%20entrance%20%2B%201')
  expect(resolveMaps({ coordinates: { latitude: 12.5, longitude: -45.5 } })).toContain('12.5%2C-45.5')
  expect(resolveMaps({})).toBeUndefined(); expect(resolveMaps(undefined)).toBeUndefined()
  expect(resolveMaps({ mapURL: 'javascript:alert(1)' })).toBeUndefined()
  expect(initialDayId(city, new Date('2026-10-08T12:00:00Z'))).toBe(city.days[0].id)
  const zoned = structuredClone(city); zoned.trip.timezone = 'Pacific/Kiritimati'
  expect(initialDayId(zoned, new Date('2030-04-12T23:00:00Z'))).toBe(city.days[1].id)
  expect(hardCutTime({ ...road.hardCuts[0], time: undefined, datetime: '2030-04-12T23:30:00Z' }, 'Pacific/Kiritimati')).toBe('13/04/2030 星期六 13:30')
})

for (const record of [cityRecord, roadRecord]) {
  const snapshot = record.payload
  test(`${snapshot.trip.slug} uses shared dedicated itinerary with ordered days/timeline and gallery`, async ({ page }) => {
    await page.goto(`#/trip/${snapshot.trip.slug}/itinerary`)
    await expect(page.getByTestId('detailed-itinerary')).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('詳細行程')
    await expect(page.getByText('內容準備中', { exact: true })).toHaveCount(0)
    await expect(page.getByTestId('trip-versions')).toHaveText(`Trip Data Version：${record.dataVersion} · Trip Schema Version：4`)
    await expect(page.getByRole('status')).toContainText('App Version v2.0.0-poc.15')
    await expect(page.locator('.itinerary-intro')).toContainText(`${snapshot.days.length} 天行程`)
    await expect(page.locator('.itinerary-day')).toHaveCount(snapshot.days.length)
    await expect(page.getByRole('navigation', { name: '行程日期' }).getByRole('button')).toHaveText(snapshot.days.map((day) => `D${day.dayNumber}`))
    for (const day of snapshot.days) {
      const section = dayFor(page, day.id)
      await expect(section.locator(':scope > summary')).toContainText(`DAY ${day.dayNumber}`)
      await expect(section.locator(':scope > summary')).toContainText(formatTripDate(day.date))
      await expect(section.locator(':scope > summary')).toContainText(day.title)
      await expect(section.locator(':scope > summary')).toContainText(day.routeSummary)
      await openDay(page, day.dayNumber)
      await expect(section).toHaveAttribute('open', '')
      expect(await section.locator('.timeline-row').evaluateAll((items) => items.map((item) => item.getAttribute('data-item-id')))).toEqual(day.timeline.map((item) => item.id))
      for (const item of day.timeline) {
        const event = section.locator(`[data-item-id="${item.id}"]`)
        await expect(event).toContainText(item.title)
        if (item.startTime) await expect(event.locator('.timeline-time')).toContainText(item.startTime)
        if (item.endTime) await expect(event.locator('.timeline-time')).toContainText(item.endTime)
        if (!item.startTime && !item.endTime) await expect(event.locator('.timeline-time time')).toHaveCount(0)
        if (item.durationMinutes !== undefined) await expect(event.locator('.timeline-badges')).toContainText(formatDuration(item.durationMinutes)!)
      }
      await expect(section.locator('.day-gallery img')).toHaveCount(day.imageIds.length)
      if (day.imageIds.length) {
        await expect(section.getByTestId('day-gallery')).toHaveClass(new RegExp(`gallery-${day.imageIds.length}`))
        await expect(section.locator('.day-gallery img').first()).toHaveCSS('object-fit', 'cover')
        for (const img of await section.locator('.day-gallery img').all()) expect(await img.getAttribute('alt')).toContain('非目的地')
      } else await expect(section.getByTestId('day-gallery')).toHaveCount(0)
      const stay = snapshot.accommodations.find((stay) => stay.id === day.accommodationId)!
      await expect(section.locator('.day-accommodation')).toContainText(stay.name)
      await expect(section.locator('.day-accommodation')).toContainText(stay.checkIn!)
      await expect(section.locator('.day-accommodation')).toContainText(stay.checkOut!)
    }
    expect(await page.locator('.itinerary-page img').evaluateAll((images) => images.some((img) => img.getAttribute('src')?.includes('travelpilot_banner')))).toBe(false)
  })

  test(`${snapshot.trip.slug} canonical place detail is labelled, sourced and keyboard-safe`, async ({ page }) => {
    await page.goto(`#/trip/${snapshot.trip.slug}/itinerary`)
    const day = snapshot.days.find((day) => day.timeline.some((item) => item.placeId === snapshot.places[0].id))!
    await openDay(page, day.dayNumber)
    const place = snapshot.places[0]
    const trigger = dayFor(page, day.id).getByRole('button', { name: `詳細介紹：${place.name}`, exact: true })
    await trigger.click()
    const dialog = page.getByRole('dialog', { name: place.name, exact: true })
    await expect(dialog).toBeVisible(); await expect(dialog).toHaveAttribute('open', '')
    for (const value of [place.summary, place.longDescription, place.whyVisit, place.history, place.localImportance, place.takeaway, `${place.rating} / 10`, place.opening, place.lastEntry, place.closing, formatMoney(place.fee), formatDuration(place.suggestedDurationMinutes), ...(place.whatToSee ?? [])]) {
      if (value) await expect(dialog).toContainText(value)
    }
    await expect(dialog.getByRole('link', { name: '官方網站 ↗', exact: true })).toHaveAttribute('href', place.officialURL!)
    for (const id of place.sourceIds) {
      const source = snapshot.sources.find((s) => s.id === id)!
      await expect(dialog.getByRole('link', { name: `${source.title} ↗`, exact: true })).toHaveAttribute('href', source.url)
    }
    await expect(dialog.getByRole('button', { name: '關閉詳細介紹' })).toBeFocused()
    await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0)
    await expect(page.locator('.place-dialog')).toHaveCount(0); await expect(trigger).toBeFocused()
    await trigger.press('Enter'); await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: '關閉詳細介紹' }).click(); await expect(dialog).toHaveCount(0)
  })

  test(`${snapshot.trip.slug} all fonts, timeline, Maps, dialog and final content fit viewport`, async ({ page }) => {
    for (const font of ['小', '中', '大']) {
      await page.goto('#/settings'); await page.getByRole('radio', { name: font, exact: true }).check()
      await page.goto(`#/trip/${snapshot.trip.slug}/itinerary`)
      for (const day of snapshot.days) await openDay(page, day.dayNumber)
      for (const section of await page.locator('.extra-content').all()) await section.locator('summary').click()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      expect(await page.locator('main').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
      for (const figure of await page.locator('.day-gallery figure').all()) {
        const { imageBox, caption } = await figure.evaluate((el) => {
          const box = el.getBoundingClientRect(), label = el.querySelector('figcaption')!.getBoundingClientRect()
          return { imageBox: { y: box.y, height: box.height }, caption: { y: label.y, height: label.height } }
        })
        expect(caption.y).toBeGreaterThanOrEqual(imageBox.y - 1)
        expect(caption.y + caption.height).toBeLessThanOrEqual(imageBox.y + imageBox.height + 1)
      }
      const jumps = page.getByRole('navigation', { name: '行程日期' })
      expect(await jumps.evaluate((el) => el.scrollWidth >= el.clientWidth)).toBe(true)
      for (const button of await jumps.getByRole('button').all()) expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44)
      const trigger = page.getByRole('button', { name: `詳細介紹：${snapshot.places[0].name}`, exact: true }).first()
      await trigger.click()
      const dialog = page.getByRole('dialog')
      const box = (await dialog.boundingBox())!
      expect(box.x).toBeGreaterThanOrEqual(0); expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize()!.width)
      expect(box.y).toBeGreaterThanOrEqual(0); expect(box.y + box.height).toBeLessThanOrEqual(page.viewportSize()!.height)
      expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
      await page.keyboard.press('Escape')
      await page.locator('main').evaluate((el) => { el.scrollTop = el.scrollHeight })
      const dock = (await page.locator('.status-dock').boundingBox())!
      const last = (await page.locator('.itinerary-day').last().boundingBox())!
      expect(last.y + last.height).toBeLessThanOrEqual(dock.y)
      await expect(page.getByRole('status')).toBeVisible()
    }
  })
}

for (const [snapshot, date, expectedDay] of [[city, '2030-04-13', 2], [road, '2025-02-07', 3]] as const) {
  test(`${snapshot.trip.slug} default day follows today generically`, async ({ page }) => {
    await page.clock.install({ time: new Date(`${date}T12:00:00Z`) })
    await page.goto(`#/trip/${snapshot.trip.slug}/itinerary`)
    await expect(page.locator('.itinerary-day[open]')).toHaveCount(1)
    await expect(page.locator('.itinerary-day[open]')).toHaveAttribute('data-day-id', snapshot.days.find((day) => day.dayNumber === expectedDay)!.id)
  })
}

test('day jump opens and focuses its day while accordions toggle independently', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-08T12:00:00Z') })
  await page.goto('#/trip/demo-trip/itinerary')
  await expect(page.locator('.itinerary-day[open]')).toHaveCount(1)
  const first = dayFor(page, city.days[0].id), second = dayFor(page, city.days[1].id)
  await page.getByRole('button', { name: '跳至 DAY 2' }).focus(); await page.keyboard.press('Enter')
  await expect(first).toHaveAttribute('open', ''); await expect(second).toHaveAttribute('open', '')
  await expect(second.locator(':scope > summary')).toBeFocused()
  await second.locator(':scope > summary').press('Space'); await expect(second).not.toHaveAttribute('open')
  await expect(second.locator('.day-content').getByRole('button', { name: `詳細介紹：${city.places[1].name}` })).not.toBeVisible()
  await expect(first).toHaveAttribute('open', '')
})

test('day warnings/constraints and shared timeline Hard Cut are distinct and data-driven', async ({ page }) => {
  await page.goto('#/trip/demo-road-trip/itinerary'); await openDay(page, 2)
  const section = dayFor(page, road.days[1].id)
  await expect(section.locator('.day-highlights')).toContainText(road.days[1].warnings[0])
  await expect(section.locator('.day-highlights')).toContainText(road.days[1].constraints[0])
  for (const host of [section.locator('.day-highlights'), section.locator('.day-timeline')]) {
    await expect(host.getByTestId('hard-cut')).toContainText('Hard Cut · 注意')
    await expect(host.getByTestId('hard-cut')).toContainText('16:00')
    await expect(host.getByTestId('hard-cut')).toContainText(road.hardCuts[0].title)
    await expect(host.getByTestId('hard-cut')).toContainText(road.hardCuts[0].description)
  }
  expect(dayHardCuts(road, road.days[1])).toHaveLength(1)
  await page.goto('#/trip/demo-trip/itinerary')
  await expect(page.getByTestId('hard-cut')).toHaveCount(0)
  await expect(page.locator('.day-highlights .content-warning')).toHaveCount(0)
})

test('optional/backup entity sections and bonus timeline use canonical records', async ({ page }) => {
  await page.goto('#/trip/demo-road-trip/itinerary'); await openDay(page, 2); await openDay(page, 3)
  const second = dayFor(page, road.days[1].id), third = dayFor(page, road.days[2].id)
  await second.locator('.backupContent > summary').click()
  await expect(second.locator('.backupContent')).toContainText(road.places[1].name)
  await expect(second.locator('.backupContent')).toContainText('7.8 / 10')
  await expect(second.locator('.backupContent').getByRole('link', { name: `Google Maps：${road.places[1].name}` })).toBeVisible()
  await second.locator('.backupContent').getByRole('button', { name: `詳細介紹：${road.places[1].name}` }).click()
  await expect(page.getByRole('dialog')).toContainText(road.places[1].whyVisit!)
  await page.keyboard.press('Escape')
  await third.locator('.optionalContent > summary').click()
  await expect(third.locator('.optionalContent')).toContainText(road.places[1].summary)
  await expect(third.locator('.optional-badge')).toHaveText('可選／Bonus')
  await second.locator('.optionalContent > summary').click()
  await expect(second.locator('.optionalContent')).toContainText(road.navigationTargets[0].title)
  await expect(second.locator('.optionalContent')).toContainText(road.transport[0].service!)
  await expect(second.locator('.optionalContent')).toContainText('Hard Cut')
  await page.goto('#/trip/demo-trip/itinerary'); await expect(page.locator('.extra-content')).toHaveCount(0)
})

test('simple city and rich road accommodation only display supplied money/payment details', async ({ page }) => {
  await page.goto('#/trip/demo-trip/itinerary')
  const simple = page.locator('.day-accommodation').first()
  await expect(simple).toContainText(city.accommodations[0].name)
  for (const label of ['付款狀態', '總價', '到店支付']) await expect(simple.getByText(label, { exact: true })).toHaveCount(0)
  await page.goto('#/trip/demo-road-trip/itinerary')
  for (const day of road.days) {
    await openDay(page, day.dayNumber)
    const section = dayFor(page, day.id).locator('.day-accommodation'), stay = road.accommodations.find((stay) => stay.id === day.accommodationId)!
    for (const value of [stay.name, stay.paymentState, formatMoney(stay.total), formatMoney(stay.paid), formatMoney(stay.arrivalPayment), stay.cancellation, stay.parking, stay.address, stay.phone, ...stay.notes]) {
      if (value) await expect(section).toContainText(value)
    }
  }
})

test('Maps and external actions use safe attributes for each mapped entity', async ({ page }) => {
  await page.goto('#/trip/demo-trip/itinerary'); await openDay(page, 2)
  await expect(page.getByRole('link', { name: `Google Maps：${city.places[0].name}`, exact: true })).toHaveAttribute('href', resolveMaps(city.places[0])!)
  await expect(page.getByRole('link', { name: `Google Maps：${city.places[1].name}`, exact: true })).toHaveAttribute('href', resolveMaps(city.places[1])!)
  await expect(page.getByRole('link', { name: `Google Maps：${city.places[2].name}`, exact: true })).toHaveCount(0)
  await page.goto('#/trip/demo-road-trip/itinerary'); await openDay(page, 2)
  const section = dayFor(page, road.days[1].id)
  await expect(section.getByRole('link', { name: `Google Maps：${road.navigationTargets[0].title}`, exact: true })).toHaveAttribute('href', resolveMaps(road.navigationTargets[0])!)
  const mapped = section.locator('.day-accommodation').getByRole('link', { name: `Google Maps：${road.accommodations[0].name}`, exact: true })
  await expect(mapped).toHaveAttribute('href', road.accommodations[0].mapURL!)
  for (const link of await page.locator('.itinerary-page a').all()) {
    await expect(link).toHaveAttribute('target', '_blank'); await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  }
})

test('minimal place and absent accommodation/hints/images hide optional UI cleanly', async ({ page }) => {
  const snapshot = structuredClone(city)
  snapshot.days = [snapshot.days[0]]
  snapshot.weather.weighting = snapshot.weather.weighting.filter((entry) => !entry.dayId || entry.dayId === snapshot.days[0].id)
  if (snapshot.schemaVersion === 3 || snapshot.schemaVersion === 4) snapshot.weather.dayRegions = snapshot.weather.dayRegions.filter((entry) => entry.dayId === snapshot.days[0].id)
  const day = snapshot.days[0]; delete day.accommodationId; day.highlights = []; day.imageIds = []
  day.timeline = [{ id: 'minimal-event', type: 'activity', title: '簡單活動', placeId: city.places[2].id, optional: false }]
  await loadCustom(page, snapshot)
  await expect(page.locator('.day-accommodation')).toHaveCount(0)
  await expect(page.locator('.day-highlights')).toHaveCount(0)
  await expect(page.getByTestId('day-gallery')).toHaveCount(0)
  await expect(page.locator('.timeline-time time')).toHaveCount(0)
  await expect(page.locator('.place-card dt')).toHaveCount(0)
  await expect(page.locator('.place-card').getByRole('link')).toHaveCount(0)
  await page.getByRole('button', { name: `詳細介紹：${city.places[2].name}` }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toContainText(city.places[2].summary)
  await expect(dialog.locator('h3')).toHaveCount(0); await expect(dialog.locator('dt')).toHaveCount(0)
  await page.keyboard.press('Escape')
})

test('all generic entity kinds, not destination IDs, can appear in optional references', async ({ page }) => {
  const snapshot = structuredClone(road)
  const refs = [
    { type: 'trip', id: remoteId },
    { type: 'place', id: snapshot.places[1].id }, { type: 'accommodation', id: snapshot.accommodations[1].id },
    { type: 'transport', id: snapshot.transport[0].id }, { type: 'navigationTarget', id: snapshot.navigationTargets[0].id },
    { type: 'hardCut', id: snapshot.hardCuts[0].id }, { type: 'region', id: snapshot.regions[0].id },
    { type: 'day', id: snapshot.days[1].id }, { type: 'timeline', id: snapshot.days[0].timeline[0].id },
    { type: 'checklist', id: snapshot.checklists[0].id }, { type: 'checklistGroup', id: snapshot.checklists[0].groups[0].id },
    { type: 'checklistItem', id: snapshot.checklists[0].groups[0].items[0].id },
    { type: 'weatherRegion', id: snapshot.weather.weatherRegions[0].id }, { type: 'activityProfile', id: snapshot.weather.activityProfiles[0].id },
    { type: 'liveCam', id: snapshot.liveCams[0].id }, { type: 'image', id: snapshot.images[0].id }, { type: 'source', id: snapshot.sources[0].id },
  ] as const
  snapshot.days[0].optionalContent = [...refs]
  const loaded = await loadCustom(page, snapshot)
  await page.locator('.optionalContent > summary').first().click()
  const section = page.locator('.optionalContent').first()
  for (const ref of refs) if (ref.type !== 'transport') await expect(section).toContainText(entityLabel(loaded, ref))
  await expect(section).toContainText(snapshot.transport[0].service!)
})

test('empty validated trip has a generic itinerary empty state', async ({ page }) => {
  const snapshot = structuredClone(city); snapshot.days = []
  snapshot.weather.weighting = snapshot.weather.weighting.filter((entry) => !entry.dayId)
  if (snapshot.schemaVersion === 3 || snapshot.schemaVersion === 4) snapshot.weather.dayRegions = []
  await loadCustom(page, snapshot)
  await expect(page.getByRole('heading', { name: '未有行程' })).toBeVisible()
  await expect(page.locator('.day-jump')).toHaveCount(0)
})

test('one shared remote load survives itinerary interactions and other view placeholders', async ({ page }) => {
  await seedAuth(page)
  let trips = 0, versions = 0
  await mockRemote(page)
  // Count at the last registered network boundary, then delegate to the mock.
  await page.route(`${supabaseOrigin}/rest/v1/v2_trips**`, async (route) => { trips++; await route.fallback() })
  await page.route(`${supabaseOrigin}/rest/v1/v2_trip_versions**`, async (route) => { versions++; await route.fallback() })
  await page.goto(`#/trip/${remoteSlug}/itinerary`)
  await expect(page.getByTestId('trip-source')).toContainText('remote')
  await openDay(page, 2)
  await page.getByRole('button', { name: `詳細介紹：${road.places[0].name}` }).click(); await page.keyboard.press('Escape')
  for (const title of ['旅程資料', '景點總覽', 'Live Cam', '今日模式']) {
    await page.getByRole('navigation', { name: '旅程頁面' }).getByRole('link', { name: title, exact: true }).click()
    if (title === '旅程資料') await expect(page.getByTestId('trip-information')).toBeVisible()
    else if (title === '景點總覽') await expect(page.getByTestId('attractions-overview')).toBeVisible()
    else if (title === 'Live Cam') await expect(page.getByTestId('live-cam')).toBeVisible()
    else await expect(page.getByRole('heading', { name: '內容準備中' })).toBeVisible()
    await expect(page.getByTestId('detailed-itinerary')).toHaveCount(0)
  }
  await page.getByRole('navigation', { name: '旅程頁面' }).getByRole('link', { name: '詳細行程', exact: true }).click()
  await expect(page.getByTestId('detailed-itinerary')).toBeVisible()
  expect(trips).toBe(1); expect(versions).toBe(1)
})

test('cached snapshot renders itinerary without repeated IndexedDB reads by child views', async ({ page }) => {
  await seedAuth(page); await mockRemote(page)
  await page.goto(`#/trip/${remoteSlug}/itinerary`); await expect(page.getByTestId('trip-source')).toContainText('remote')
  const before = await cacheContents(page)
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => false })
    const get = IDBObjectStore.prototype.get
    ;(window as unknown as { cacheReads: number }).cacheReads = 0
    IDBObjectStore.prototype.get = function (...args) {
      if (this.transaction.db.name === 'travelpilot-v2-trips') (window as unknown as { cacheReads: number }).cacheReads++
      return get.apply(this, args)
    }
  })
  await page.reload(); await expect(page.getByTestId('trip-source')).toContainText('cache')
  const reads = await page.evaluate(() => (window as unknown as { cacheReads: number }).cacheReads)
  expect(reads).toBeGreaterThan(0)
  await openDay(page, 2)
  await expect(page.getByTestId('detailed-itinerary')).toBeVisible()
  await page.getByRole('navigation', { name: '旅程頁面' }).getByRole('link', { name: '旅程資料', exact: true }).click()
  await page.getByRole('navigation', { name: '旅程頁面' }).getByRole('link', { name: '詳細行程', exact: true }).click()
  expect(await page.evaluate(() => (window as unknown as { cacheReads: number }).cacheReads)).toBe(reads)
  expect(await cacheContents(page)).toEqual(before)
})

test('switching trips resets open day/place state and does not leak itinerary metadata', async ({ page }) => {
  await page.goto('#/trip/demo-trip/itinerary'); await openDay(page, 2)
  await page.getByRole('navigation', { name: '主導覽' }).getByRole('link', { name: '首頁', exact: true }).click()
  await page.getByRole('article').filter({ hasText: road.trip.title }).getByRole('link', { name: '詳細行程', exact: true }).click()
  await expect(page.getByTestId('detailed-itinerary')).not.toContainText(city.days[0].title)
  await expect(page.getByTestId('detailed-itinerary')).not.toContainText(city.places[0].name)
  await expect(page.locator('.itinerary-day[open]')).toHaveCount(1)
  await expect(page.getByTestId('trip-versions')).toContainText('demo.road.5')
  await page.getByRole('navigation', { name: '主導覽' }).getByRole('link', { name: '設定', exact: true }).click()
  await page.getByRole('button', { name: '返回上一頁' }).click()
  await expect(page).toHaveURL(/#\/trip\/demo-road-trip\/itinerary$/)
  await expect(page.getByTestId('detailed-itinerary')).not.toContainText(city.trip.title)
})

test('gallery rejects unresolved/brand images, caps at three, and recovers from broken images', async ({ page }) => {
  expect(resolveContentImage({ id: 'brand', url: 'assets/images/travelpilot_banner.PNG', alt: '品牌圖片' })).toBeNull()
  const errors: string[] = []; page.on('pageerror', (error) => errors.push(error.message))
  await renderGallery(page, { imageIds: ['unresolved', 'brand'], images: [{ id: 'brand', url: 'assets/images/travelpilot_banner.PNG', alt: '品牌圖片' }] })
  await expect(page.getByTestId('day-gallery')).toHaveCount(0)
  const images = [...city.images, { ...city.images[0], id: 'fourth' }]
  await renderGallery(page, { imageIds: images.map((i) => i.id), images })
  await expect(page.getByTestId('day-gallery').locator('img')).toHaveCount(3)
  await page.route('https://example.invalid/broken.svg', (route) => route.fulfill({ status: 404 }))
  await renderGallery(page, { imageIds: ['broken', city.images[0].id], images: [{ id: 'broken', url: 'https://example.invalid/broken.svg', alt: '無法載入的測試圖片' }, city.images[0]] })
  await expect(page.getByTestId('day-gallery')).toHaveClass(/gallery-1/)
  await expect(page.getByTestId('day-gallery').locator('img')).toHaveCount(1)
  await renderGallery(page, { imageIds: ['broken'], images: [{ id: 'broken', url: 'https://example.invalid/broken.svg', alt: '無法載入的測試圖片' }] })
  await expect(page.getByTestId('day-gallery')).toHaveCount(0)
  expect(errors).toEqual([])
})

test('all six timeline types retain stored order and missing optional fields', async ({ page }) => {
  const snapshot = structuredClone(city)
  snapshot.days[0].timeline = ['activity', 'travel', 'meal', 'stay', 'break', 'other'].map((type, i) => ({ id: `generic-${i}`, type: type as typeof city.days[number]['timeline'][number]['type'], title: `通用項目 ${i}`, optional: false }))
  await loadCustom(page, snapshot)
  expect(await page.locator('.itinerary-day').first().locator('.timeline-row').evaluateAll((items) => items.map((item) => item.getAttribute('data-item-type')))).toEqual(['activity', 'travel', 'meal', 'stay', 'break', 'other'])
  await expect(page.locator('.itinerary-day').first().locator('.timeline-time time')).toHaveCount(0)
  await expect(page.locator('.itinerary-day').first().locator('.timeline-badges')).toHaveText(['📍 活動', '↗ 交通', '🍽 餐飲', '⌂ 住宿', '☕ 休息', '• 其他'])
})

test('only TripLayout loads snapshots; content code cannot access backend/cache or legacy architecture', () => {
  const files = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? files(join(dir, entry.name)) : [join(dir, entry.name)])
  for (const path of ['src/views/DetailedItinerary.tsx', ...files('src/components/itinerary')]) {
    const source = readFileSync(path, 'utf8')
    expect(source).not.toMatch(/loadTrip\(|supabase|indexedDB|readCachedTrip|DEFAULT_TRIP|hydrate|Japan|Shirakawa|Nagoya|Takayama|Bangkok|Hokkaido|demo-trip|demo-road-trip/i)
  }
  const calls = files('src').filter((path) => /\.(tsx?|css)$/.test(path) && readFileSync(path, 'utf8').includes('loadTrip('))
  expect(calls.sort()).toEqual(['src/services/trips.ts', 'src/views/TripLayout.tsx'])
})

for (const record of [cityRecord, roadRecord]) {
  test(`visual QA ${record.payload.trip.slug} hierarchy, gallery, timeline, dialog and bottom`, async ({ page }) => {
    const snapshot = record.payload
    await page.clock.install({ time: new Date('2026-10-08T12:00:00Z') })
    if (page.viewportSize()!.width === 320 && snapshot === road) {
      await page.goto('#/settings'); await page.getByRole('radio', { name: '大', exact: true }).check()
    }
    await page.goto(`#/trip/${snapshot.trip.slug}/itinerary`)
    await expect(page.getByTestId('detailed-itinerary')).toBeVisible()
    await page.locator('.brand img, .itinerary-page img').evaluateAll((images) => Promise.all(images.map((img) => (img as HTMLImageElement).decode())))
    await page.screenshot({ path: test.info().outputPath('intro.png') })
    await dayFor(page, snapshot.days[0].id).evaluate((el) => el.scrollIntoView({ block: 'start' }))
    await page.screenshot({ path: test.info().outputPath('day-gallery.png') })
    const placeDay = snapshot.days.find((day) => day.timeline.some((item) => item.placeId === snapshot.places[0].id))!
    await openDay(page, placeDay.dayNumber)
    await dayFor(page, placeDay.id).locator('.day-timeline').scrollIntoViewIfNeeded()
    await page.screenshot({ path: test.info().outputPath('timeline.png') })
    await page.getByRole('button', { name: `詳細介紹：${snapshot.places[0].name}`, exact: true }).click()
    await page.screenshot({ path: test.info().outputPath('place-dialog.png') }); await page.keyboard.press('Escape')
    for (const day of snapshot.days) await openDay(page, day.dayNumber)
    for (const section of await page.locator('.extra-content').all()) await section.locator('summary').click()
    if (snapshot === road) {
      await dayFor(page, snapshot.days[1].id).locator('.backupContent').scrollIntoViewIfNeeded()
      await page.screenshot({ path: test.info().outputPath('backup.png') })
    }
    await page.locator('main').evaluate((el) => { el.scrollTop = el.scrollHeight })
    await page.screenshot({ path: test.info().outputPath('bottom.png') })
  })
}
