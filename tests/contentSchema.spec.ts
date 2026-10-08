import { test, expect } from './fixtures'
import { CURRENT_TRIP_SCHEMA_VERSION, SUPPORTED_TRIP_SCHEMA_VERSIONS, validateTripSnapshot, type Schema3Snapshot, type Schema4Snapshot } from '../src/data/schema/trip'
import schema3City from './fixtures/schema3-city.json' with { type: 'json' }
import schema3Road from './fixtures/schema3-road.json' with { type: 'json' }
import schema2City from './fixtures/schema2-city.json' with { type: 'json' }
import schema2Road from './fixtures/schema2-road.json' with { type: 'json' }
import { legacyCity, legacyRoad } from './legacySnapshots'
import { cityContent, roadContent, mediaSnapshot } from './contentFixtures'
import { derivePlaceUsage, groupPlaceUsage, placeUsageCounts } from '../src/data/attractions'
import { cameraActions, cameraFilterDays, cameraPresentation, getLiveCamDayIds, groupLiveCams, resolveCamera } from '../src/data/liveCams'
import { resolveContentImage } from '../src/data/images'
import { forecastRequest } from '../src/services/weather/forecasts'
import packageMetadata from '../package.json' with { type: 'json' }

test('four strict snapshot readers retain actual source versions and separate release/data versions', () => {
  expect(CURRENT_TRIP_SCHEMA_VERSION).toBe(4); expect(SUPPORTED_TRIP_SCHEMA_VERSIONS).toEqual([1, 2, 3, 4])
  for (const snapshot of [legacyCity, legacyRoad, schema2City, schema2Road, schema3City, schema3Road, cityContent, roadContent]) {
    expect(validateTripSnapshot(snapshot)).toMatchObject({ valid: true, snapshot })
  }
  expect(validateTripSnapshot({ ...roadContent, schemaVersion: 5 })).toMatchObject({ valid: false, reason: 'unsupported-schema' })
  expect(packageMetadata.version).toBe('2.0.0-poc.16')
})
const invalid: [string, (snapshot: Schema4Snapshot) => void][] = [
  ['missing day array', (s) => { delete (s.liveCams[0] as Partial<typeof s.liveCams[0]>).routeDayIds }],
  ['comma separated days', (s) => { s.liveCams[0].routeDayIds = 'day1,day2' as unknown as string[] }],
  ['duplicate camera day', (s) => { s.liveCams[0].routeDayIds.push(s.liveCams[0].routeDayIds[0]) }],
  ['broken camera day', (s) => { s.liveCams[0].routeDayIds.push('absent') }],
  ['broken camera region', (s) => { s.liveCams[0].regionId = 'absent' }],
  ['broken camera place', (s) => { s.liveCams[0].placeId = 'absent' }],
  ['camera region/place mismatch', (s) => { s.liveCams[0].regionId = s.regions[0].id }],
  ['invalid priority', (s) => { s.liveCams[0].priority = 'must' as 'primary' }],
  ['empty tag', (s) => { s.liveCams[0].tags = [''] }],
  ['blank tag', (s) => { s.liveCams[0].tags = ['   '] }],
  ['unsafe source URL', (s) => { s.liveCams[0].sourceURL = 'javascript:alert(1)' }],
  ['unsafe preview URL', (s) => { s.liveCams[0].previewURL = 'data:image/png;base64,a' }],
  ['unsafe official URL', (s) => { s.liveCams[0].officialURL = 'file:///tmp/a' }],
  ['unsafe status URL', (s) => { s.liveCams[0].statusURL = 'ftp://example.invalid' }],
  ['old singular field in Schema 4', (s) => { Object.assign(s.liveCams[0], { routeDayId: s.days[0].id }) }],
  ['stored Place status', (s) => { Object.assign(s.places[0], { status: 'main' }) }],
]
for (const [label, mutate] of invalid) test(`Schema 4 rejects ${label} with structured validation issues`, () => {
  const snapshot = structuredClone(roadContent); mutate(snapshot)
  const result = validateTripSnapshot(snapshot)
  expect(result).toMatchObject({ valid: false, reason: 'invalid-data' })
  if (!result.valid) { expect(result.issues.length).toBeGreaterThan(0); expect(result.issues.every((issue) => issue.path.length && issue.message)).toBeTruthy() }
})
test('old singular contracts remain strict, without accepting new metadata or multi-day field', () => {
  for (const original of [legacyRoad, schema2Road, schema3Road]) {
    expect(validateTripSnapshot(original).valid).toBe(true)
    for (const extra of [{ routeDayIds: [] }, { priority: 'primary' }, { tags: [] }, { description: 'new' }]) {
      const snapshot = structuredClone(original); Object.assign(snapshot.liveCams[0], extra)
      expect(validateTripSnapshot(snapshot)).toMatchObject({ valid: false, reason: 'invalid-data' })
    }
  }
})
test('Schema 4 accepts region-only, place-only, both, global and empty day relations', () => {
  for (const shape of [{ regionId: roadContent.regions[0].id }, { placeId: roadContent.places[0].id }, { regionId: roadContent.places[0].regionId, placeId: roadContent.places[0].id }, {}]) {
    const snapshot = structuredClone(roadContent)
    snapshot.liveCams = [{ id: 'flexible-camera', label: '通用測試', routeDayIds: [], tags: [], sourceType: 'external', sourceURL: 'http://example.invalid/cam', ...shape }]
    expect(validateTripSnapshot(snapshot)).toMatchObject({ valid: true })
  }
})
for (const [label, kind] of [['normal timeline', 'main'], ['optional timeline', 'optional'], ['bonus timeline', 'bonus'], ['optionalContent', 'optionalContent'], ['backupContent', 'backupContent']] as const) {
  test(`canonical ${label} produces correct Place usage without mutation`, () => {
    const snapshot = structuredClone(cityContent), place = snapshot.places[0], day = snapshot.days[0]
    for (const d of snapshot.days) { d.timeline = []; d.optionalContent = []; d.backupContent = [] }
    if (kind === 'optionalContent' || kind === 'backupContent') day[kind] = [{ type: 'place', id: place.id }]
    else day.timeline = [{ id: 'test-occurrence', type: 'activity', title: '通用', placeId: place.id, optional: kind === 'optional', bonus: kind === 'bonus' }]
    const before = structuredClone(snapshot), usage = derivePlaceUsage(snapshot)
    expect(usage).toHaveLength(1); expect(usage[0].place).toBe(place)
    expect(usage[0].statuses).toEqual([kind === 'main' ? 'main' : kind === 'backupContent' ? 'backup' : 'optional'])
    expect(snapshot).toEqual(before)
  })
}
test('multi-status/place/day counts deduplicate without inventing unreferenced usage', () => {
  const snapshot = structuredClone(cityContent), place = snapshot.places[0]
  snapshot.days[0].timeline.push({ id: 'repeat-main', type: 'activity', title: '重複', optional: false, placeId: place.id })
  snapshot.days[0].optionalContent.push({ type: 'place', id: place.id })
  snapshot.days[1].backupContent.push({ type: 'place', id: place.id })
  snapshot.places.push({ ...place, id: 'unreferenced', name: '未安排場所' })
  const usage = derivePlaceUsage(snapshot), item = usage.find((item) => item.place.id === place.id)!
  expect(item.statuses).toEqual(['main', 'optional', 'backup']); expect(item.days.map((day) => day.id)).toEqual([snapshot.days[0].id, snapshot.days[1].id])
  expect(item.occurrences).toHaveLength(3); expect(usage.some((item) => item.place.id === 'unreferenced')).toBe(false)
  const counts = placeUsageCounts(usage)
  expect(counts).toEqual({ all: 3, main: 3, optional: 1, backup: 1 })
  for (const filter of ['all', 'main', 'optional', 'backup'] as const) {
    const result = groupPlaceUsage(snapshot, usage, filter).flatMap((group) => group.places)
    expect(result.filter((item) => item.place.id === place.id)).toHaveLength(1)
  }
})
test('region order and place/day/status sorting are canonical, deterministic and safely unmapped', () => {
  const snapshot = structuredClone(roadContent), before = structuredClone(snapshot)
  const usage = derivePlaceUsage(snapshot), groups = groupPlaceUsage(snapshot, usage, 'all')
  expect(groups.map((group) => group.id)).toEqual(snapshot.regions.map((region) => region.id))
  expect(groups.flatMap((group) => group.places).map((item) => item.place.id)).toEqual(['road-backup', 'road-trail'])
  expect(snapshot).toEqual(before)
  const strange = structuredClone(usage); strange[0].place.regionId = 'absent'
  expect(groupPlaceUsage(snapshot, strange, 'all').at(-1)?.label).toBe('其他地區')
})
test('compatibility returns all Schema 4 days, singular old days or no association without mutation', () => {
  const old = (schema3Road as Schema3Snapshot).liveCams[0], before = structuredClone(old)
  expect(getLiveCamDayIds(old)).toEqual([old.routeDayId])
  expect(getLiveCamDayIds({ ...old, routeDayId: undefined })).toEqual([])
  const modern = roadContent.liveCams[0], ids = getLiveCamDayIds(modern)
  expect(ids).toEqual(modern.routeDayIds); ids.pop(); expect(modern.routeDayIds).toHaveLength(2); expect(old).toEqual(before)
})
test('camera grouping/filtering follows region then place then trip-global and never duplicates multi-day record', () => {
  const snapshot = structuredClone(roadContent), cam = snapshot.liveCams[0]
  expect(resolveCamera(snapshot, cam).region?.id).toBe(cam.regionId)
  expect(resolveCamera(snapshot, { ...cam, regionId: undefined }).region?.id).toBe(snapshot.places[0].regionId)
  expect(resolveCamera(snapshot, { ...cam, regionId: undefined, placeId: undefined }).region).toBeUndefined()
  expect(groupLiveCams(snapshot).flatMap((group) => group.cameras)).toHaveLength(3)
  for (const dayId of cam.routeDayIds) expect(groupLiveCams(snapshot, dayId).flatMap((group) => group.cameras).filter((item) => item.cam.id === cam.id)).toHaveLength(1)
  expect(groupLiveCams(snapshot, snapshot.days[0].id).flatMap((group) => group.cameras).some((item) => item.cam.id === cam.id)).toBe(false)
  expect(cameraFilterDays(snapshot).map((day) => day.dayNumber)).toEqual([1, 2, 3, 4])
  expect(groupLiveCams(snapshot).at(-1)?.label).toBe('其他／全程')
})
test('sourceType and HTTPS alone drive media capability; actions normalize and deduplicate safe URLs', () => {
  const snapshot = mediaSnapshot()
  expect(snapshot.liveCams.map((cam) => cameraPresentation(cam).mode)).toEqual(['embed', 'image', 'external', 'external', 'external'])
  const cam = roadContent.liveCams[0]
  expect(cameraActions(cam).map((action) => action.label)).toEqual(['開啟 Live Cam／官方來源', '查看官方狀態'])
  expect(cameraActions({ ...cam, officialURL: 'javascript:alert(1)', statusURL: cam.sourceURL })).toHaveLength(1)
  expect(cameraPresentation({ ...cam, previewURL: 'http://example.invalid/img' }).preview).toBeUndefined()
})
test('image resolver rejects the Home banner and missing records while weather request config remains identical across Schema 3/4', () => {
  expect(resolveContentImage(undefined)).toBeNull()
  expect(resolveContentImage({ id: 'brand', url: 'assets/images/travelpilot_banner.PNG', alt: '品牌' })).toBeNull()
  const modern = forecastRequest(roadContent, 'road-weather-high'), old = forecastRequest(schema3Road as Schema3Snapshot, 'road-weather-high')
  expect(modern).toEqual(old)
})
