import { readFileSync } from 'node:fs'
import { test, expect, supabaseOrigin } from './fixtures'
import { validateTripSnapshot, hasWeatherConfiguration } from '../src/data/schema/trip'
import { automaticPosition, deriveToday } from '../src/data/today'
import { timelineTimeLabel, timelineStartInstant, timelineEndInstant } from '../src/data/tripTime'
import { timingFixture, crossZoneTiming, overnightTiming } from './timelineTimingFixtures'
import { todayFixture, openToday } from './todayFixtures'
import { legacyRoad } from './legacySnapshots'
import schema2Road from './fixtures/schema2-road.json' with { type: 'json' }
import schema3Road from './fixtures/schema3-road.json' with { type: 'json' }
import { cacheContents } from './tripFixtures'
import type { TripSnapshot } from '../src/data/schema/trip'

const positionIds = (position: ReturnType<typeof automaticPosition>) => [position.previous?.id ?? null, position.current?.id ?? null, position.next?.id ?? null]
const at = (instant: string, timezone = 'Etc/UTC') => ({ date: '2025-02-05', timezone, now: new Date(instant) })

test('Schema 5 same-zone, cross-zone and overnight endpoints validate without fixture mutation', () => {
  for (const timing of [crossZoneTiming, overnightTiming, {
    start: { dateTime: '2025-02-05T10:00:00Z', timeZone: 'Europe/London' },
    end: { dateTime: '2025-02-05T11:00:00Z', timeZone: 'Europe/London' },
  }]) {
    const snapshot = timingFixture(timing), before = structuredClone(snapshot)
    expect(validateTripSnapshot(snapshot)).toMatchObject({ valid: true, snapshot })
    expect(hasWeatherConfiguration(snapshot)).toBe(true)
    expect(snapshot).toEqual(before)
    expect(timelineStartInstant(snapshot.days[0].timeline[0], '2025-02-05', 'Etc/UTC')).toBe(Date.parse(timing.start.dateTime))
    expect(timelineEndInstant(snapshot.days[0].timeline[0], '2025-02-05', 'Etc/UTC')).toBe(Date.parse(timing.end.dateTime))
  }
})
test('exact timing requires no legacy clocks and accepts date-line travel ordered by instants', () => {
  const snapshot = timingFixture({
    start: { dateTime: '2025-02-06T09:00:00+13:00', timeZone: 'Pacific/Auckland' },
    end: { dateTime: '2025-02-05T15:00:00-08:00', timeZone: 'America/Los_Angeles' },
  }), item = snapshot.days[0].timeline[0]
  delete item.startTime; delete item.endTime
  expect(validateTripSnapshot(snapshot).valid).toBe(true)
  expect(positionIds(automaticPosition([item], at('2025-02-05T21:00:00Z')))).toEqual([null, item.id, null])
  expect(timelineTimeLabel(item, 'end')).toContain('05/02/2025 星期三 15:00')
})
for (const endpoint of ['start', 'end'] as const) test(`Schema 5 rejects invalid/non-IANA zones and missing offsets at ${endpoint}`, () => {
  for (const timeZone of ['Invalid/Timezone', '+08:00', '-05:00', '']) {
    const snapshot = timingFixture(); snapshot.days[0].timeline[0].timing![endpoint].timeZone = timeZone
    const result = validateTripSnapshot(snapshot)
    expect(result).toMatchObject({ valid: false, reason: 'invalid-data' })
    if (!result.valid) expect(result.issues.some((issue) => issue.path.join('.') === `days.0.timeline.0.timing.${endpoint}.timeZone`)).toBe(true)
  }
  for (const dateTime of ['2025-02-05T10:00:00', '2025-02-30T10:00:00+08:00', 'not a datetime']) {
    const snapshot = timingFixture(); snapshot.days[0].timeline[0].timing![endpoint].dateTime = dateTime
    expect(validateTripSnapshot(snapshot)).toMatchObject({ valid: false, reason: 'invalid-data' })
  }
})
test('both exact endpoints are required and strict; equal/reversed absolute instants fail with structured issues', () => {
  for (const end of ['2025-02-05T11:00:00+09:00', '2025-02-05T10:59:59+09:00']) {
    const snapshot = timingFixture(); snapshot.days[0].timeline[0].timing!.end.dateTime = end
    const result = validateTripSnapshot(snapshot)
    expect(result).toMatchObject({ valid: false, reason: 'invalid-data' })
    if (!result.valid) expect(result.issues).toContainEqual(expect.objectContaining({ path: ['days', 0, 'timeline', 0, 'timing', 'end', 'dateTime'] }))
  }
  for (const timing of [{ start: crossZoneTiming.start }, { end: crossZoneTiming.end }, { ...crossZoneTiming, extra: true }, { ...crossZoneTiming, start: { ...crossZoneTiming.start, extra: true } }, null]) {
    const snapshot = timingFixture(); Object.assign(snapshot.days[0].timeline[0], { timing })
    expect(validateTripSnapshot(snapshot)).toMatchObject({ valid: false, reason: 'invalid-data' })
  }
})
test('each endpoint displays its own declared timezone, calendar date and 24-hour clock', () => {
  const item = timingFixture().days[0].timeline[0]
  expect(timelineTimeLabel(item, 'start')).toBe('05/02/2025 星期三 10:00 · Asia/Hong_Kong')
  expect(timelineTimeLabel(item, 'end')).toBe('05/02/2025 星期三 14:30 · Asia/Tokyo')
  item.timing = overnightTiming
  expect(timelineTimeLabel(item, 'start')).toBe('05/02/2025 星期三 22:30 · America/New_York')
  expect(timelineTimeLabel(item, 'end')).toBe('06/02/2025 星期四 11:30 · Europe/London')
  // Display follows the declared IANA zone, not the literal offset's wall clock.
  item.timing = { start: { dateTime: '2025-02-05T10:00:00Z', timeZone: 'Europe/Paris' }, end: { dateTime: '2025-02-05T11:00:00Z', timeZone: 'Europe/Paris' } }
  expect(timelineTimeLabel(item, 'start')).toContain('11:00 · Europe/Paris')
})
test('cross-zone current/previous/next and completed/upcoming use instants, overriding local clocks', () => {
  const snapshot = timingFixture(), day = snapshot.days[0]
  for (const [instant, expected] of [
    ['2025-02-05T01:59:59Z', [null, null, 'today-first']],
    ['2025-02-05T02:00:00Z', [null, 'today-first', 'today-optional']],
    ['2025-02-05T03:30:00Z', [null, 'today-first', 'today-optional']],
    ['2025-02-05T05:30:00Z', ['today-first', null, 'today-optional']],
    ['2025-02-05T11:30:00Z', ['today-optional', 'today-required', 'today-untimed']],
    ['2025-02-05T16:00:00Z', ['today-stay', null, null]],
  ] as const) expect(positionIds(deriveToday(snapshot, day, new Date(instant)).position)).toEqual(expected)
})
test('overnight cross-zone intervals remain exact across arrival calendar dates and end-exclusive boundaries', () => {
  const snapshot = timingFixture(overnightTiming), item = snapshot.days[0].timeline[0]
  for (const [instant, expected] of [
    ['2025-02-06T03:29:59Z', [null, null, 'today-first']],
    ['2025-02-06T03:30:00Z', [null, 'today-first', null]],
    ['2025-02-06T11:29:59Z', [null, 'today-first', null]],
    ['2025-02-06T11:30:00Z', ['today-first', null, null]],
  ] as const) expect(positionIds(automaticPosition([item], at(instant, 'America/New_York')))).toEqual(expected)
  snapshot.trip.timezone = 'America/New_York'; snapshot.days[0].timeline = [item]
  const during = deriveToday(snapshot, snapshot.days[0], new Date('2025-02-06T04:15:00Z'))
  expect(during.actualToday).toBe(true); expect(during.position.current?.id).toBe(item.id)
})
test('mixed legacy/exact items share instant boundaries, including implicit and overnight legacy windows', () => {
  const item = timingFixture().days[0].timeline[0]
  const legacy = { id: 'legacy', title: 'legacy', type: 'activity' as const, optional: false, startTime: '01:00' }
  expect(positionIds(automaticPosition([legacy, item], at('2025-02-05T01:30:00Z')))).toEqual([null, 'legacy', 'today-first'])
  expect(positionIds(automaticPosition([legacy, item], at('2025-02-05T02:00:00Z')))).toEqual(['legacy', 'today-first', null])
  const overnight = { ...legacy, startTime: '23:00', endTime: '01:00' }
  item.timing = { start: { dateTime: '2025-02-06T02:00:00Z', timeZone: 'Etc/UTC' }, end: { dateTime: '2025-02-06T03:00:00Z', timeZone: 'Etc/UTC' } }
  expect(positionIds(automaticPosition([overnight, item], at('2025-02-06T00:30:00Z')))).toEqual([null, 'legacy', 'today-first'])
  expect(positionIds(automaticPosition([overnight, item], at('2025-02-06T01:00:00Z')))).toEqual(['legacy', null, 'today-first'])
})
test('Schema 5 with no timing preserves legacy derivation, display and manual preview behavior', () => {
  const old = todayFixture(), snapshot = { ...structuredClone(old), schemaVersion: 5 as const }
  expect(validateTripSnapshot(snapshot).valid).toBe(true)
  for (const instant of ['2025-02-05T08:00:00Z', '2025-02-05T09:30:00Z', '2025-02-05T10:00:00Z', '2025-02-05T10:30:00Z', '2025-02-05T16:00:00Z', '2026-01-01T00:00:00Z']) {
    expect(deriveToday(snapshot, snapshot.days[0], new Date(instant))).toEqual(deriveToday(old, old.days[0], new Date(instant)))
  }
  for (const item of snapshot.days[0].timeline) {
    expect(timelineTimeLabel(item, 'start')).toBe(item.startTime ?? '未定時間')
    expect(timelineTimeLabel(item, 'end')).toBe(item.endTime)
  }
})
test('Schemas 1–4 remain unchanged, reject exact timing and use legacy Today calculations', () => {
  for (const original of [legacyRoad, schema2Road, schema3Road, todayFixture()]) {
    const result = validateTripSnapshot(original)
    expect(result).toMatchObject({ valid: true, snapshot: original })
    if (!result.valid) continue
    const snapshot = result.snapshot, day = snapshot.days[0], instant = new Date(`${day.date}T10:30:00Z`)
    snapshot.trip.timezone = 'Etc/UTC'
    expect(deriveToday(snapshot, day, instant).position).toEqual(automaticPosition(day.timeline, 630))
    Object.assign(day.timeline[0], { timing: crossZoneTiming })
    expect(validateTripSnapshot(snapshot)).toMatchObject({ valid: false, reason: 'invalid-data' })
  }
})
test('exact timing is generic and no runtime fixtures, stores, data loaders or geography branches are added', () => {
  for (const file of ['src/data/schema/trip.ts', 'src/data/tripTime.ts', 'src/data/today.ts', 'src/views/TodayMode.tsx']) {
    const source = readFileSync(file, 'utf8')
    expect(source).not.toMatch(/Asia\/(?:Tokyo|Hong_Kong)|America\/New_York|Europe\/London|Japan|Shirakawa|Bangkok|Hokkaido|demo-road-trip|demo-trip/)
    expect(source).not.toMatch(/(?:trip\.slug|country|dayNumber|placeId)\s*===\s*['"\d]/)
  }
})

test('Today UI uses exact times, preserves manual/reset/preview and caches Schema 5 without rewriting old contracts', async ({ page }) => {
  const snapshot = await openToday(page, timingFixture(), '2025-02-05T03:30:20Z')
  const focus = page.locator('.today-current')
  await expect(focus).toContainText('計劃出發')
  await expect(focus).toContainText('10:00 · Asia/Hong_Kong')
  await expect(focus).toContainText('14:30 · Asia/Tokyo')
  await expect(focus).not.toContainText('18:00')
  await expect(page.locator('.today-delta')).toHaveText('原定時間已過 90分鐘')
  await expect(page.getByTestId('trip-versions')).toContainText('Trip Schema Version：5')
  await page.getByRole('button', { name: '已到達／下一項 →' }).click()
  await expect(page.getByTestId('today-mode')).toHaveAttribute('data-progress-mode', 'manual')
  await expect(focus).toContainText('可選短暫停留')
  await page.getByRole('button', { name: '按時間自動', exact: true }).click()
  await expect(focus).toContainText('計劃出發')
  await page.getByRole('navigation', { name: '今日模式行程日期' }).getByRole('button', { name: 'D2', exact: true }).click()
  await expect(page.getByTestId('today-mode')).toHaveAttribute('data-progress-mode', 'preview')
  await expect(page.getByRole('button', { name: '按時間自動', exact: true })).toBeDisabled()
  const before = await cacheContents(page)
  expect(before.versions).toContainEqual(expect.objectContaining({ schemaVersion: 5, dataVersion: 'today.test.1', payload: snapshot }))
  await page.addInitScript(() => { localStorage.clear(); Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => false }) })
  await page.route(`${supabaseOrigin}/**`, (route) => route.abort())
  await page.reload()
  await expect(page.getByTestId('today-mode')).toBeVisible()
  await expect(page.getByTestId('trip-source')).toContainText('cache')
  expect(await cacheContents(page)).toEqual(before)
})
test('exact timing automatic progress honors seconds rather than truncating to the minute', async ({ page }) => {
  const snapshot = timingFixture({ start: { dateTime: '2025-02-05T03:30:25Z', timeZone: 'Etc/UTC' }, end: { dateTime: '2025-02-05T03:30:27Z', timeZone: 'Etc/UTC' } })
  await openToday(page, snapshot, '2025-02-05T03:30:24Z')
  await expect(page.locator('.today-current')).not.toContainText('計劃出發')
  await expect(page.locator('.today-neighbours')).toContainText('計劃出發')
  await page.clock.runFor(1000)
  await expect(page.locator('.today-current')).toContainText('計劃出發')
  await page.clock.runFor(2000)
  await expect(page.locator('.today-current')).not.toContainText('計劃出發')
  await expect(page.getByRole('article', { name: '上一項', exact: true })).toContainText('計劃出發')
})
test('overnight endpoint labels wrap safely with Large font at all supported widths', async ({ page }, testInfo) => {
  const snapshot = timingFixture(overnightTiming); snapshot.trip.timezone = 'America/New_York'; snapshot.days[0].timeline = [snapshot.days[0].timeline[0]]
  delete snapshot.days[0].timeline[0].startTime; delete snapshot.days[0].timeline[0].endTime
  await openToday(page, snapshot, '2025-02-06T04:15:00Z')
  await page.evaluate(() => document.documentElement.dataset.fontSize = 'large')
  await expect(page.locator('.today-current')).toContainText('06/02/2025 星期四 11:30 · Europe/London')
  expect(await page.evaluate(() => document.body.scrollWidth <= window.innerWidth && document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).fontSize)).toBe('18px')
  const before = await page.locator('.today-current').boundingBox()
  expect(before!.width).toBeLessThanOrEqual(page.viewportSize()!.width)
  await expect(page.getByRole('button', { name: '按時間自動', exact: true })).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath('schema5-exact-timing.png'), fullPage: true })
})
