import { readFileSync } from 'node:fs'
import { test, expect } from './fixtures'
import { validateTripSnapshot, type Schema5Snapshot } from '../src/data/schema/trip'
import { activeExactDay, dayHasActiveExactTiming } from '../src/data/operationalTiming'
import { selectTodayDay, deriveToday, isOperationalDay } from '../src/data/today'
import { operationalTripStatus, tripStatus, orderTrips } from '../src/data/tripDates'
import { timelineTimeLabel } from '../src/data/tripTime'
import { todayPreviewKey } from '../src/app/useTodaySession'
import { todayFixture, openToday } from './todayFixtures'
import { remoteId } from './tripFixtures'
import { localTrips } from '../src/data/trips'
import { renderCards } from './homeHarness'
import { legacyRoad } from './legacySnapshots'
import schema2Road from './fixtures/schema2-road.json' with { type: 'json' }
import schema3Road from './fixtures/schema3-road.json' with { type: 'json' }

const now = (value = '2025-02-06T00:30:00Z') => new Date(value)
function operationalFixture(): Schema5Snapshot {
  const snapshot: Schema5Snapshot = { ...todayFixture(), schemaVersion: 5 }
  snapshot.trip.timezone = 'Europe/London'
  snapshot.days[0].timeline = [
    { id: 'before', type: 'activity', title: '較早活動', startTime: '22:00', endTime: '23:00', optional: false },
    { id: 'overnight', type: 'travel', title: '合成跨日活動', startTime: '10:00', endTime: '11:00', optional: false,
      timing: { start: { dateTime: '2025-02-05T23:30:00Z', timeZone: 'Europe/London' }, end: { dateTime: '2025-02-06T01:30:00Z', timeZone: 'Europe/London' } } },
    { id: 'after', type: 'activity', title: '較後活動', optional: false,
      timing: { start: { dateTime: '2025-02-06T02:00:00Z', timeZone: 'Europe/London' }, end: { dateTime: '2025-02-06T03:00:00Z', timeZone: 'Europe/London' } } },
  ]
  return snapshot
}
function finalActivityFixture() {
  const snapshot = operationalFixture(), item = structuredClone(snapshot.days[0].timeline[1])
  item.timing = { start: { dateTime: '2025-02-08T23:30:00Z', timeZone: 'Europe/London' }, end: { dateTime: '2025-02-09T01:30:00Z', timeZone: 'Europe/London' } }
  snapshot.days[0].timeline = []; snapshot.days[3].timeline = [item]
  return snapshot
}

test('active exact interval extends its owning operational Day after midnight without mutating data', () => {
  const snapshot = operationalFixture(), before = structuredClone(snapshot)
  expect(validateTripSnapshot(snapshot).valid).toBe(true)
  expect(dayHasActiveExactTiming(snapshot, snapshot.days[0], now())).toBe(true)
  expect(isOperationalDay(snapshot, snapshot.days[0], now())).toBe(true)
  expect(selectTodayDay(snapshot, now())?.id).toBe(snapshot.days[0].id)
  const model = deriveToday(snapshot, snapshot.days[0], now())
  expect(model.actualToday).toBe(true); expect(model.manual).toBe(false)
  expect([model.position.previous?.id, model.position.current?.id, model.position.next?.id]).toEqual(['before', 'overnight', 'after'])
  expect(snapshot).toEqual(before)
})
for (const [instant, active] of [['2025-02-05T23:29:59Z', false], ['2025-02-05T23:30:00Z', true], ['2025-02-06T01:29:59Z', true], ['2025-02-06T01:30:00Z', false], ['2025-02-06T01:30:01Z', false]] as const)
  test(`operational exact boundaries are half-open at ${instant}`, () => {
    const snapshot = operationalFixture()
    expect(dayHasActiveExactTiming(snapshot, snapshot.days[0], now(instant))).toBe(active)
    if (instant >= '2025-02-06T01:30:00Z') {
      expect(selectTodayDay(snapshot, now(instant))?.id).toBe(snapshot.days[1].id)
      expect(deriveToday(snapshot, snapshot.days[0], now(instant)).actualToday).toBe(false)
    }
  })
test('active exact Day outranks calendar date and remembered preview; ordinary preview resumes outside trip', () => {
  const snapshot = operationalFixture()
  expect(selectTodayDay(snapshot, now(), snapshot.days[2].id)?.id).toBe(snapshot.days[0].id)
  expect(selectTodayDay(snapshot, now('2025-02-06T01:30:00Z'), snapshot.days[2].id)?.id).toBe(snapshot.days[1].id)
  expect(selectTodayDay(snapshot, now('2026-01-01T00:00:00Z'), snapshot.days[2].id)?.id).toBe(snapshot.days[2].id)
})
test('overlapping active exact Days choose latest start then canonical Day number independent of array order', () => {
  const snapshot = operationalFixture(), item = structuredClone(snapshot.days[0].timeline[1])
  item.id = 'overlap'; item.timing!.start.dateTime = '2025-02-06T00:15:00Z'; snapshot.days[2].timeline = [item]
  expect(validateTripSnapshot(snapshot).valid).toBe(true)
  expect(activeExactDay(snapshot, now())?.id).toBe(snapshot.days[2].id)
  item.timing!.start.dateTime = '2025-02-05T23:30:00Z'
  snapshot.days.reverse()
  expect(activeExactDay(snapshot, now())?.dayNumber).toBe(1)
})
test('schemas 1–4 and Schema 5 without exact timing preserve calendar selection and preview semantics', () => {
  for (const original of [legacyRoad, schema2Road, schema3Road, todayFixture(), { ...todayFixture(), schemaVersion: 5 as const }]) {
    const result = validateTripSnapshot(original); expect(result.valid).toBe(true)
    if (!result.valid) continue
    const snapshot = result.snapshot; snapshot.trip.timezone = 'Europe/London'
    expect(activeExactDay(snapshot, now())).toBeUndefined()
    expect(selectTodayDay(snapshot, now())?.date).toBe('2025-02-06')
    expect(deriveToday(snapshot, snapshot.days[0], now()).actualToday).toBe(false)
    expect(operationalTripStatus(snapshot, now('2025-02-09T00:30:00Z'))).toBe('completed')
  }
})
test('invalid exact windows cannot extend a day even when a caller bypasses validation', () => {
  const snapshot = operationalFixture(); snapshot.days[0].timeline = [snapshot.days[0].timeline[1]]
  for (const value of ['invalid', '2025-02-05T23:30:00Z', '2025-02-05T22:30:00Z']) {
    snapshot.days[0].timeline[0].timing!.end.dateTime = value
    expect(activeExactDay(snapshot, now())).toBeUndefined()
  }
})
test('Home operational status remains current after endDate and returns to completed at exact end', () => {
  const snapshot = finalActivityFixture(), before = structuredClone(snapshot)
  expect(validateTripSnapshot(snapshot).valid).toBe(true)
  expect(tripStatus(snapshot.trip, '2025-02-09')).toBe('completed')
  expect(operationalTripStatus(snapshot, now('2025-02-09T00:30:00Z'))).toBe('current')
  expect(operationalTripStatus(snapshot, now('2025-02-09T01:30:00Z'))).toBe('completed')
  expect(snapshot).toEqual(before)
})
test('structurally valid exact timing before startDate is operationally current without changing trip dates', () => {
  const snapshot = operationalFixture(); snapshot.days[0].timeline = [snapshot.days[0].timeline[1]]
  snapshot.days[0].timeline[0].timing = { start: { dateTime: '2025-02-04T23:30:00Z', timeZone: 'Europe/London' }, end: { dateTime: '2025-02-05T01:30:00Z', timeZone: 'Europe/London' } }
  expect(validateTripSnapshot(snapshot).valid).toBe(true)
  expect(operationalTripStatus(snapshot, now('2025-02-05T00:00:00Z'))).toBe('current')
  expect(operationalTripStatus(snapshot, now('2025-02-04T23:45:00Z'))).toBe('current')
  expect(tripStatus(snapshot.trip, '2025-02-04')).toBe('upcoming')
  expect(snapshot.trip.startDate).toBe('2025-02-05')
})
test('snapshot-aware Home sorting is deterministic and immutable; demo temporal statuses stay unchanged', () => {
  const snapshot = finalActivityFixture(), records = [
    { ...snapshot.trip, slug: 'z', snapshot }, { ...snapshot.trip, slug: 'a', snapshot },
    { ...snapshot.trip, slug: 'calendar-completed' },
    { ...snapshot.trip, slug: 'future', startDate: '2030-01-01', endDate: '2030-01-02' },
  ], before = structuredClone(records)
  expect(orderTrips(records, now('2025-02-09T00:30:00Z')).map(({ trip, status }) => [trip.slug, status])).toEqual([['a', 'current'], ['z', 'current'], ['future', 'upcoming'], ['calendar-completed', 'completed']])
  expect(records).toEqual(before)
  expect(orderTrips(localTrips.map(({ payload }) => ({ ...payload.trip, snapshot: payload })), now('2026-10-09T00:00:00Z')).map(({ status }) => status)).toEqual(['upcoming', 'completed'])
})
test('fresh Today shows active owning Day, beats remembered preview, supports manual/reset and truthful explicit preview', async ({ page }) => {
  const snapshot = operationalFixture()
  await page.addInitScript(({ key, id }) => sessionStorage.setItem(key, id), { key: todayPreviewKey(remoteId), id: snapshot.days[2].id })
  await openToday(page, snapshot, '2025-02-06T00:30:00Z')
  await expect(page.getByTestId('today-mode')).toHaveAttribute('data-selected-day', snapshot.days[0].id)
  await expect(page.getByTestId('today-mode')).toHaveAttribute('data-progress-mode', 'auto')
  await expect(page.locator('.today-current')).toContainText('合成跨日活動')
  await expect(page.locator('.today-mode-label')).not.toContainText('預覽')
  await page.getByRole('button', { name: '已到達／下一項 →' }).click()
  await expect(page.getByTestId('today-mode')).toHaveAttribute('data-progress-mode', 'manual')
  await page.getByRole('button', { name: '按時間自動', exact: true }).click()
  await expect(page.locator('.today-current')).toContainText('合成跨日活動')
  await page.getByRole('navigation', { name: '今日模式行程日期' }).getByRole('button', { name: 'D3', exact: true }).click()
  await expect(page.getByTestId('today-mode')).toHaveAttribute('data-progress-mode', 'preview')
  await page.clock.runFor(1000)
  await expect(page.getByTestId('today-mode')).toHaveAttribute('data-selected-day', snapshot.days[2].id)
})
test('open Today automatically hands back to canonical date at the exact end instant', async ({ page }) => {
  const snapshot = operationalFixture(); snapshot.days[0].timeline = [snapshot.days[0].timeline[1]]
  snapshot.days[0].timeline[0].timing!.end.dateTime = '2025-02-06T00:30:02Z'
  await openToday(page, snapshot, '2025-02-06T00:30:00Z')
  await expect(page.getByTestId('today-mode')).toHaveAttribute('data-selected-day', snapshot.days[0].id)
  await page.clock.runFor(1000)
  await expect(page.getByTestId('today-mode')).toHaveAttribute('data-selected-day', snapshot.days[0].id)
  await page.clock.runFor(1000)
  await expect(page.getByTestId('today-mode')).toHaveAttribute('data-selected-day', snapshot.days[1].id)
  await expect(page.getByTestId('today-mode')).toHaveAttribute('data-progress-mode', 'auto')
  await expect(page.locator('.today-current')).not.toContainText('合成跨日活動')
})
test('Home card shows operational current badge without changing displayed date range', async ({ page }) => {
  const snapshot = finalActivityFixture()
  await renderCards(page, [snapshot], '2025-02-09T00:30:00Z')
  await expect(page.getByTestId('trip-status')).toHaveText('旅程進行中')
  await expect(page.locator('.trip-card-dates time')).toHaveText(['05/02/2025 星期三', '08/02/2025 星期六'])
  await renderCards(page, [snapshot], '2025-02-09T01:30:00Z')
  await expect(page.getByTestId('trip-status')).toHaveText('旅程已完成')
  await expect(page.locator('.trip-card-dates time').last()).toHaveAttribute('datetime', '2025-02-08')
})
for (const kind of ['legacy', 'same-zone', 'cross-zone', 'cross-date'] as const) test(`Detailed Itinerary ${kind} labels and semantic datetimes remain readable`, async ({ page }, testInfo) => {
  const snapshot = kind === 'legacy' ? todayFixture() : operationalFixture()
  if (snapshot.schemaVersion === 5) {
    snapshot.days[0].timeline = [snapshot.days[0].timeline[1]]
    if (kind === 'same-zone') snapshot.days[0].timeline[0].timing!.end.dateTime = '2025-02-05T23:50:00Z'
    if (kind === 'cross-zone') snapshot.days[0].timeline[0].timing!.end = { dateTime: '2025-02-06T14:30:00+13:00', timeZone: 'Pacific/Auckland' }
    if (kind === 'cross-date') snapshot.days[0].timeline[0].timing!.end = { dateTime: '2025-02-05T17:30:00-08:00', timeZone: 'America/Los_Angeles' }
  }
  await openToday(page, snapshot, '2025-02-05T23:40:00Z')
  await page.getByRole('navigation', { name: '旅程頁面' }).getByRole('link', { name: '詳細行程', exact: true }).click()
  await page.getByRole('button', { name: '跳至 DAY 1', exact: true }).click()
  await page.evaluate(() => document.documentElement.dataset.fontSize = 'large')
  const row = page.locator('.timeline-row').filter({ has: page.getByRole('heading', { name: kind === 'legacy' ? '計劃出發' : '合成跨日活動', exact: true }) })
  const times = row.locator('.timeline-time time')
  if (snapshot.schemaVersion === 5) {
    const item = snapshot.days[0].timeline[0]
    await expect(times).toHaveText([timelineTimeLabel(item, 'start')!, timelineTimeLabel(item, 'end')!])
    await expect(times.first()).toHaveAttribute('datetime', item.timing!.start.dateTime)
    await expect(times.last()).toHaveAttribute('datetime', item.timing!.end.dateTime)
    await expect(row.locator('.timeline-time')).not.toContainText('10:00')
  } else await expect(row.locator('.timeline-time')).toHaveText('09:00 – 10:00')
  expect(await page.evaluate(() => document.body.scrollWidth <= innerWidth && document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await row.scrollIntoViewIfNeeded()
  expect((await row.locator('.timeline-event').boundingBox())!.width).toBeGreaterThan(page.viewportSize()!.width < 700 ? page.viewportSize()!.width * 0.6 : 500)
  if (kind === 'cross-zone') await page.screenshot({ path: testInfo.outputPath('operational-timeline-large.png'), fullPage: true })
})
test('runtime patch is schema/data-neutral and contains no geography or activity-type inference', () => {
  for (const file of ['src/data/operationalTiming.ts', 'src/data/tripDates.ts', 'src/data/tripTime.ts', 'src/data/today.ts', 'src/app/useTodaySession.ts', 'src/components/itinerary/Timeline.tsx', 'src/views/TodayMode.tsx']) {
    const source = readFileSync(file, 'utf8')
    expect(source).not.toMatch(/Japan|Hong Kong|Nagoya|UO680|UO685|Asia\/(?:Tokyo|Hong_Kong)|\bD9\b|\bflight\b/i)
    expect(source).not.toMatch(/(?:trip\.slug|country|dayNumber|placeId|item\.title)\s*===\s*['"\d]/)
  }
  expect(readFileSync('src/views/Home.tsx', 'utf8')).toContain('snapshot: payload')
})
