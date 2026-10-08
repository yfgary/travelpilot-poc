import type { Page } from '@playwright/test'
import type { Schema4Snapshot, TripSnapshot } from '../src/data/schema/trip'
import { validateTripSnapshot } from '../src/data/schema/trip'
import { roadContent } from './contentFixtures'
import { expect, fakeSession, storageKey } from './fixtures'
import { mockRemote, remoteId, remoteSlug, remoteVersion } from './tripFixtures'

export function todayFixture(): Schema4Snapshot {
  const snapshot = structuredClone(roadContent)
  snapshot.trip.timezone = 'Etc/UTC'
  snapshot.days.forEach((day) => {
    day.timeline.forEach((item) => { delete item.hardCutId })
    day.optionalContent = day.optionalContent.filter((ref) => ref.type !== 'hardCut')
    day.backupContent = day.backupContent.filter((ref) => ref.type !== 'hardCut')
  })
  snapshot.days[0].timeline = [
    { id: 'today-first', type: 'travel', title: '計劃出發', startTime: '09:00', endTime: '10:00', optional: false, transportId: snapshot.transport[0].id },
    { id: 'today-optional', type: 'activity', title: '可選短暫停留', startTime: '10:15', endTime: '10:45', optional: true, bonus: true, placeId: snapshot.places[1].id, warning: '虛構可選活動注意事項' },
    { id: 'today-required', type: 'activity', title: '主要計劃目的地', startTime: '11:00', endTime: '12:00', optional: false, placeId: snapshot.places[0].id, navigationTargetId: snapshot.navigationTargets[0].id },
    { id: 'today-untimed', type: 'break', title: '未定時間的小休', optional: false },
    { id: 'today-stay', type: 'stay', title: '返回當日住宿', startTime: '15:00', endTime: '15:30', optional: false, accommodationId: snapshot.accommodations[0].id },
  ]
  snapshot.hardCuts = [
    { id: 'today-cut-late', dayId: snapshot.days[0].id, time: '16:00', title: '較晚限制', description: '虛構計劃限制', severity: 'critical', priority: 99 },
    { id: 'today-cut-linked', time: '10:45', title: '結構連結限制', description: '來自時間軸參照', severity: 'warning', priority: 1 },
    { id: 'today-cut-early', dayId: snapshot.days[0].id, datetime: '2025-02-05T08:00:00Z', title: '較早限制', description: '虛構計劃限制', severity: 'info', priority: 0 },
  ]
  snapshot.days[0].timeline[2].hardCutId = 'today-cut-linked'
  return snapshot
}
export function openToday<T extends TripSnapshot>(page: Page, original: T, time?: string): Promise<T>
export function openToday(page: Page): Promise<Schema4Snapshot>
export async function openToday(page: Page, original: TripSnapshot = todayFixture(), time = '2025-02-05T10:30:20Z') {
  await page.clock.install({ time: new Date(Date.parse(time) - 1000) })
  await page.clock.pauseAt(new Date(time))
  const snapshot = structuredClone(original)
  snapshot.trip = { ...snapshot.trip, id: remoteId, slug: remoteSlug }
  expect(validateTripSnapshot(snapshot)).toMatchObject({ valid: true })
  await page.addInitScript(({ key, session }) => {
    if (!sessionStorage.getItem('today-test-auth')) { localStorage.setItem(key, JSON.stringify(session)); sessionStorage.setItem('today-test-auth', 'yes') }
  }, { key: storageKey, session: fakeSession(Math.floor(Date.parse(time) / 1000) + 86400) })
  await mockRemote(page, () => ({ ...remoteVersion(), schema_version: snapshot.schemaVersion, data_version: 'today.test.1', payload: snapshot }))
  await page.goto(`#/trip/${remoteSlug}/today`)
  await expect(page.getByTestId('today-mode')).toBeVisible()
  return snapshot
}
