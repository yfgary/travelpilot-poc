import { test, expect } from './fixtures'
import { minimalSnapshot } from './minimalSnapshot'
import { validateTripSnapshot, TRIP_SCHEMA_VERSION } from '../src/data/schema/trip'
import type { Schema1Snapshot as TripSnapshot } from '../src/data/schema/trip'
const sample = () => structuredClone(minimalSnapshot)

test('canonical version-1 demo validates with structured issues for malformed input', () => {
  expect(TRIP_SCHEMA_VERSION).toBe(2)
  expect(validateTripSnapshot(sample()).valid).toBe(true)
  for (const bad of [null, {}, [], 'not json']) {
    const result = validateTripSnapshot(bad)
    expect(result.valid).toBe(false)
    if (!result.valid) expect(result.issues[0]).toHaveProperty('path')
  }
  expect(validateTripSnapshot({ ...sample(), schemaVersion: 3 })).toMatchObject({ valid: false, reason: 'unsupported-schema' })
})
const cases: [string, (snapshot: TripSnapshot) => void][] = [
  ['duplicate region ID', (s) => { s.regions.push({ ...s.regions[0] }) }],
  ['duplicate timeline ID', (s) => { s.days[0].timeline.push({ ...s.days[0].timeline[0] }) }],
  ['broken region', (s) => { s.places[0].regionId = 'missing' }],
  ['broken place', (s) => { s.days[0].timeline[0].placeId = 'missing' }],
  ['broken accommodation', (s) => { s.days[0].accommodationId = 'missing' }],
  ['broken timeline accommodation', (s) => { s.days[0].timeline[0].accommodationId = 'missing' }],
  ['broken transport', (s) => { s.days[0].timeline[0].transportId = 'missing' }],
  ['broken navigation target', (s) => { s.days[0].timeline[0].navigationTargetId = 'missing' }],
  ['broken hard cut', (s) => { s.days[0].timeline[0].hardCutId = 'missing' }],
  ['broken image', (s) => { s.trip.heroImageId = 'missing' }],
  ['broken day image', (s) => { s.days[0].imageIds = ['missing'] }],
  ['broken activity profile', (s) => { s.places[0].activityProfileIds = ['missing'] }],
  ['broken source', (s) => { s.places[0].sourceIds = ['missing'] }],
  ['broken weather configuration', (s) => { s.regions[0].weatherConfigurationId = 'missing' }],
  ['broken primary weather region', (s) => { s.days[0].primaryWeatherRegionId = 'missing' }],
  ['broken optional content', (s) => { s.days[0].optionalContent = [{ type: 'place', id: 'missing' }] }],
  ['invalid calendar date', (s) => { s.trip.startDate = '2030-02-30' }],
  ['reversed trip dates', (s) => { s.trip.startDate = '2030-06-02' }],
  ['day outside range', (s) => { s.days[0].date = '2030-06-02' }],
  ['duplicate day number and date', (s) => { s.days.push({ ...s.days[0], id: 'second-day', timeline: [] }) }],
  ['invalid latitude', (s) => { s.regions[0].coordinates!.latitude = 91 }],
  ['invalid longitude', (s) => { s.regions[0].coordinates!.longitude = -181 }],
  ['invalid rating', (s) => { s.places[0].rating = 11 }],
  ['negative rating', (s) => { s.places[0].rating = -1 }],
  ['negative duration', (s) => { s.days[0].timeline[0].durationMinutes = -1 }],
  ['invalid time', (s) => { s.days[0].timeline[0].startTime = '25:00' }],
  ['invalid checklist item ID', (s) => { s.checklists = [{ id: 'list', type: 'preparation', title: '準備', order: 0, notes: [], groups: [{ id: 'group', title: '物品', order: 0, notes: [], items: [{ id: 'bad id', label: '物品', order: 0, notes: [] }] }] }] }],
  ['duplicate checklist item ID', (s) => { s.checklists = [{ id: 'list', type: 'preparation', title: '準備', order: 0, notes: [], groups: [{ id: 'group', title: '物品', order: 0, notes: [], items: [0, 1].map((order) => ({ id: 'item', label: '物品', order, notes: [] })) }] }] }],
]
test('runtime validation rejects IDs, cross references, dates, coordinates, ratings and durations', () => {
  for (const [name, mutate] of cases) {
    const snapshot = sample(); mutate(snapshot)
    const result = validateTripSnapshot(snapshot)
    expect(result.valid, name).toBe(false)
    if (!result.valid) expect(result.issues.length, name).toBeGreaterThan(0)
  }
})
test('generic rich content supports all required concepts and validates their relationships', () => {
  const s = sample()
  s.images = [{ id: 'image', url: 'assets/images/travelpilot_icon.PNG', alt: '示範圖片', attribution: '示範', licenseNote: '測試' }]
  s.sources = [{ id: 'source', title: '資料來源', url: 'https://example.invalid/source', type: 'official', checkedAt: '2030-01-01T00:00:00Z', entity: { type: 'place', id: s.places[0].id } }]
  s.trip.heroImageId = 'image'
  s.accommodations = [{ id: 'stay', name: '示範住宿', type: 'hotel', stayStartDate: '2030-06-01', stayEndDate: '2030-06-02', address: '示範地址', phone: '000', room: '雙人房', mealPlan: '早餐', bookingState: 'confirmed', paymentState: 'partial', total: { amount: 100, currency: 'USD' }, paid: { amount: 40, currency: 'USD' }, arrivalPayment: { amount: 60, currency: 'USD' }, checkIn: '15:00', checkOut: '11:00', cancellation: '按條款', parking: '附設', notes: [] }]
  s.transport = [{ id: 'ride', type: 'bus', provider: '示範服務', service: '接駁', origin: '集合點', destination: '入口', departure: '2030-06-01T09:00:00Z', arrival: '2030-06-01T10:00:00Z', durationMinutes: 60, bookingState: 'confirmed', paymentState: 'paid', price: { amount: 10, currency: 'USD' }, navigationTargetIds: [s.navigationTargets[0].id], notes: [], warnings: [] }]
  s.hardCuts = [{ id: 'cut', dayId: s.days[0].id, time: '17:00', title: '集合', severity: 'warning', priority: 1, category: 'meeting', icon: 'clock', description: '準時集合', sourceId: 'source' }]
  s.days[0].accommodationId = 'stay'; s.days[0].imageIds = ['image']; s.days[0].timeline[0].transportId = 'ride'; s.days[0].timeline[0].hardCutId = 'cut'
  s.weather.weatherRegions = [{ id: 'weather-region', regionId: s.regions[0].id, label: '示範天氣區', operationNotes: [] }]
  s.weather.activityProfiles = [{ id: 'profile', label: '戶外活動', weights: { precipitation: 1 }, operationNotes: [] }]
  s.weather.weighting = [{ regionId: s.regions[0].id, dayId: s.days[0].id, activityProfileId: 'profile', weight: 1 }]
  s.days[0].primaryWeatherRegionId = 'weather-region'; s.regions[0].weatherConfigurationId = 'weather-region'
  s.places[0] = { ...s.places[0], rating: 8, whyVisit: '值得探索', history: '背景', localImportance: '地方文化', whatToSee: ['風景'], takeaway: '了解目的地', opening: '09:00', lastEntry: '16:30', closing: '17:00', fee: { amount: 0, currency: 'USD' }, suggestedDurationMinutes: 60, imageIds: ['image'], sourceIds: ['source'], activityProfileIds: ['profile'] }
  s.liveCams = [{ id: 'cam', label: '示範鏡頭', regionId: s.regions[0].id, placeId: s.places[0].id, routeDayId: s.days[0].id, group: '示範路線', sourceType: 'external', sourceURL: 'https://example.invalid/cam' }]
  expect(validateTripSnapshot(s).valid).toBe(true)
  for (const mutate of [
    (s: TripSnapshot) => { s.liveCams[0].routeDayId = 'missing' },
    (s: TripSnapshot) => { s.weather.weighting[0].activityProfileId = 'missing' },
    (s: TripSnapshot) => { s.sources[0].entity!.id = 'missing' },
    (s: TripSnapshot) => { s.transport[0].navigationTargetIds = ['missing'] },
    (s: TripSnapshot) => { s.hardCuts[0].dayId = 'missing' },
  ]) { const copy = structuredClone(s); mutate(copy); expect(validateTripSnapshot(copy).valid).toBe(false) }
})
