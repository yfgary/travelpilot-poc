import { test, expect } from './fixtures'
import { automaticPosition, deriveToday, resolveTodayStop, selectTodayDay } from '../src/data/today'
import { calendarInstant, plannedDelta, timeMinutes, tripTime } from '../src/data/tripTime'
import type { TimelineItem } from '../src/data/itinerary'
import { todayFixture } from './todayFixtures'
import { cityContent, roadContent } from './contentFixtures'

const item = (id: string, startTime?: string, endTime?: string): TimelineItem => ({ id, title: id, type: 'activity', optional: false, startTime, endTime })
const clock = (time: string) => new Date(`2025-02-05T${time}:00Z`)
const ids = (position: ReturnType<typeof automaticPosition>) => [position.previous?.id ?? null, position.current?.id ?? null, position.next?.id ?? null]
for (const [name, items, minute, expected] of [
  ['before first timed activity', [item('a', '09:00', '10:00'), item('b', '11:00', '12:00')], 480, [null, null, 'a']],
  ['inside explicit interval', [item('a', '09:00', '10:00'), item('b', '11:00', '12:00')], 570, [null, 'a', 'b']],
  ['end-exclusive gap', [item('a', '09:00', '10:00'), item('b', '11:00', '12:00')], 600, ['a', null, 'b']],
  ['implicit end boundary', [item('a', '09:00'), item('b', '11:00', '12:00')], 660, ['a', 'b', null]],
  ['implicit window', [item('a', '09:00'), item('b', '11:00', '12:00')], 630, [null, 'a', 'b']],
  ['after final explicit interval', [item('a', '09:00', '10:00'), item('b', '11:00', '12:00')], 800, ['b', null, null]],
  ['last open-ended planned activity', [item('a', '09:00')], 800, [null, 'a', null]],
  ['cross midnight before midnight', [item('a', '23:00', '01:00')], 1430, [null, 'a', null]],
  ['cross midnight after midnight', [item('a', '23:00', '01:00')], 30, [null, 'a', null]],
  ['untimed items never become clock current', [item('u'), item('a', '09:00', '10:00'), item('v'), item('b', '11:00', '12:00')], 570, [null, 'a', 'v']],
  ['all untimed has no automatic position', [item('u'), item('v')], 700, [null, null, null]],
  ['empty timeline', [], 700, [null, null, null]],
] as const) test(`automatic planned position: ${name}`, () => {
  const before = structuredClone(items)
  expect(ids(automaticPosition(items, minute))).toEqual(expected)
  expect(items).toEqual(before)
})
test('trip-local initial day outranks remembered preview; arbitrary day numbers and stored array order are supported', () => {
  const snapshot = todayFixture(); snapshot.days[0].dayNumber = 21; snapshot.days[1].dayNumber = 7
  snapshot.trip.timezone = 'Pacific/Auckland'
  expect(selectTodayDay(snapshot, new Date('2025-02-05T23:00:00Z'), snapshot.days[0].id)?.id).toBe(snapshot.days[1].id)
  expect(selectTodayDay(snapshot, new Date('2026-01-01T00:00:00Z'))?.id).toBe(snapshot.days[2].id)
  expect(selectTodayDay(snapshot, new Date('2026-01-01T00:00:00Z'), snapshot.days[0].id)?.id).toBe(snapshot.days[0].id)
  expect(selectTodayDay(snapshot, new Date('2026-01-01T00:00:00Z'), 'missing')?.id).toBe(snapshot.days[2].id)
})
test('timezone helpers preserve local midnight, seconds and offset date across browser timezone differences', () => {
  const instant = new Date('2025-02-05T23:04:09Z')
  expect(tripTime(instant, 'Pacific/Auckland', true)).toBe('12:04:09')
  expect(tripTime(instant, 'Pacific/Auckland')).toBe('12:04')
  expect(timeMinutes('23:59')).toBe(1439)
  expect(new Date(calendarInstant('2025-02-06', '12:04', 'Pacific/Auckland')).toISOString()).toBe('2025-02-05T23:04:00.000Z')
  expect(plannedDelta(35 * 60000, 0)).toBe('距原定時間 35分鐘')
  expect(plannedDelta(0, 20 * 60000)).toBe('原定時間已過 20分鐘')
})
test('preview never derives activity from current clock; manual stable item focus is separate from automatic position', () => {
  const snapshot = todayFixture(), day = snapshot.days[0]
  const preview = deriveToday(snapshot, day, new Date('2026-01-01T23:00:00Z'))
  expect(preview.actualToday).toBe(false); expect(preview.position.current?.id).toBe(day.timeline[0].id)
  const manual = deriveToday(snapshot, day, clock('10:30'), 'today-untimed')
  expect(manual.manual).toBe(true); expect(ids(manual.position)).toEqual(['today-required', 'today-untimed', 'today-stay'])
  expect(deriveToday(snapshot, day, clock('10:30'), 'invalid').manual).toBe(false)
})
test('optional active activity never outranks the next required mapped destination and derivation is immutable', () => {
  const snapshot = todayFixture(), before = structuredClone(snapshot)
  const model = deriveToday(snapshot, snapshot.days[0], clock('10:30'))
  expect(model.position.current?.id).toBe('today-optional')
  expect(model.nextStop?.item.id).toBe('today-required')
  expect(model.navigation?.id).toBe(snapshot.navigationTargets[0].id)
  expect(model.activities.map(({ item }) => item.id)).toEqual(snapshot.days[0].timeline.map((item) => item.id))
  expect(snapshot).toEqual(before)
})
test('only optional/bonus mapped stops remain explicitly identifiable, and end-of-day has no next destination', () => {
  const snapshot = todayFixture(), day = snapshot.days[0]
  day.timeline = [day.timeline[1]]
  expect(deriveToday(snapshot, day, clock('10:30')).nextStop?.item.optional).toBe(true)
  expect(deriveToday(snapshot, day, clock('12:00')).nextStop).toBeUndefined()
})
for (const kind of ['navigation', 'place', 'accommodation', 'transport-map', 'transport-target', 'none'] as const) test(`structured Maps resolution: ${kind}`, () => {
  const snapshot = todayFixture(), activity = item('test')
  const target = snapshot.navigationTargets[0], place = snapshot.places[0], stay = snapshot.accommodations[0], transport = snapshot.transport[0]
  target.mapURL = 'https://maps.example.invalid/target'; place.mapURL = 'https://maps.example.invalid/place'; stay.mapURL = 'https://maps.example.invalid/stay'
  transport.mapURL = 'https://maps.example.invalid/transport'; transport.navigationTargetIds = [target.id]
  if (kind === 'navigation') Object.assign(activity, { navigationTargetId: target.id, placeId: place.id, accommodationId: stay.id, transportId: transport.id })
  if (kind === 'place') Object.assign(activity, { placeId: place.id, accommodationId: stay.id, transportId: transport.id })
  if (kind === 'accommodation') Object.assign(activity, { accommodationId: stay.id, transportId: transport.id })
  if (kind.startsWith('transport')) activity.transportId = transport.id
  if (kind === 'transport-target') delete transport.mapURL
  const stop = resolveTodayStop(snapshot, activity)
  expect(stop?.maps).toBe(kind === 'none' ? undefined : `https://maps.example.invalid/${({ navigation: 'target', place: 'place', accommodation: 'stay', 'transport-map': 'transport', 'transport-target': 'target' } as const)[kind]}`)
})
test('unmapped explicit target falls through to canonical coordinates, not a title-derived destination', () => {
  const snapshot = todayFixture(), activity = item('test'); activity.navigationTargetId = snapshot.navigationTargets[0].id; activity.placeId = snapshot.places[0].id
  delete snapshot.navigationTargets[0].mapURL; delete snapshot.navigationTargets[0].mapQuery; delete snapshot.navigationTargets[0].coordinates
  delete snapshot.places[0].mapURL; snapshot.places[0].coordinates = { latitude: 12, longitude: 34 }
  expect(resolveTodayStop(snapshot, activity)?.maps).toBe('https://www.google.com/maps/search/?api=1&query=12%2C34')
  expect(resolveTodayStop(snapshot, { ...item('none'), title: 'hotel parking deadline' })).toBeUndefined()
})
test('Hard Cuts include timeline-only references, resolve local instants and sort chronology before priority', () => {
  const snapshot = todayFixture(); snapshot.trip.timezone = 'Pacific/Auckland'
  const model = deriveToday(snapshot, snapshot.days[0], clock('00:00'))
  expect(model.hardCuts.map(({ cut }) => cut.id)).toEqual(['today-cut-linked', 'today-cut-late', 'today-cut-early'])
  expect(model.hardCuts[0].instant).toBe(Date.parse('2025-02-04T21:45:00Z'))
  expect(deriveToday(snapshot, snapshot.days[1], clock('00:00')).hardCuts).toEqual([])
})
for (const source of ['day', 'timeline', 'mapped-final', 'none'] as const) test(`final destination priority: ${source}`, () => {
  const snapshot = todayFixture(), day = snapshot.days[0]
  if (source !== 'day') delete day.accommodationId
  if (source === 'day') { day.accommodationId = snapshot.accommodations[1].id; expect(deriveToday(snapshot, day, clock('10:30')).accommodation?.id).toBe(snapshot.accommodations[1].id) }
  if (source === 'timeline') expect(deriveToday(snapshot, day, clock('10:30')).accommodation?.id).toBe(snapshot.accommodations[0].id)
  if (source === 'mapped-final') { day.timeline = [day.timeline[2]]; const model = deriveToday(snapshot, day, clock('10:30')); expect(model.accommodation).toBeUndefined(); expect(model.finalStop?.item.id).toBe('today-required') }
  if (source === 'none') { day.timeline = [item('unmapped')]; const model = deriveToday(snapshot, day, clock('10:30')); expect(model.accommodation).toBeUndefined(); expect(model.finalStop).toBeUndefined() }
})
test('driving notice depends only on structured car references including optional/backup content', () => {
  expect(deriveToday(cityContent, cityContent.days[0], new Date()).driving).toBe(false)
  expect(deriveToday(roadContent, roadContent.days[0], new Date()).driving).toBe(true)
  const snapshot = todayFixture(), day = snapshot.days[0]; day.timeline = []
  day.optionalContent = [{ type: 'transport', id: snapshot.transport[0].id }]
  expect(deriveToday(snapshot, day, clock('10:30')).driving).toBe(true)
})
