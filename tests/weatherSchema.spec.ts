import { test, expect } from './fixtures'
import { localTrips } from '../src/data/trips'
import { CURRENT_TRIP_SCHEMA_VERSION, SUPPORTED_TRIP_SCHEMA_VERSIONS, validateTripSnapshot, type Schema3Snapshot } from '../src/data/schema/trip'
import schema3City from './fixtures/schema3-city.json' with { type: 'json' }
import schema3Road from './fixtures/schema3-road.json' with { type: 'json' }
import { legacyCity, legacyRoad } from './legacySnapshots'
import schema2City from './fixtures/schema2-city.json' with { type: 'json' }
import schema2Road from './fixtures/schema2-road.json' with { type: 'json' }
import { forecastRequest } from '../src/services/weather/forecasts'
import { forecastURL, normalizeOpenMeteo, localDate } from '../src/services/weather/providers/openMeteo'
import { openMeteoResponse } from './weatherFixtures'
import { defaultWeatherRegion } from '../src/data/weather/regions'
const city = schema3City as Schema3Snapshot, road = schema3Road as Schema3Snapshot
const request = forecastRequest(road, 'road-weather-high')!.request

test('four strict contracts remain readable without changing any source snapshot version', () => {
  expect(CURRENT_TRIP_SCHEMA_VERSION).toBe(5); expect(SUPPORTED_TRIP_SCHEMA_VERSIONS).toEqual([1, 2, 3, 4, 5])
  for (const snapshot of [legacyCity, legacyRoad, schema2City, schema2Road, city, road, ...localTrips.map((record) => record.payload)]) expect(validateTripSnapshot(snapshot)).toMatchObject({ valid: true, snapshot })
  for (const version of [6, 0, '3', null]) expect(validateTripSnapshot({ ...road, schemaVersion: version })).toMatchObject({ valid: false, reason: 'unsupported-schema' })
  expect(city.schemaVersion).toBe(3); expect(road.schemaVersion).toBe(3)
  expect(localTrips.map((record) => record.dataVersion)).toEqual(['demo.road.5', 'demo.city.5'])
})
const mutations: [string, (snapshot: Schema3Snapshot) => void][] = [
  ['missing provider', (s) => { s.weather.weatherRegions[0].providerId = 'absent' }],
  ['duplicate provider ID', (s) => { s.weather.forecastProviders.push(structuredClone(s.weather.forecastProviders[0])) }],
  ['provider unsafe config', (s) => { s.weather.forecastProviders[0].config = { password: 'not-a-real-credential' } }],
  ['non JSON provider config', (s) => { s.weather.forecastProviders[0].config = { callback: () => true } }],
  ['bad provider config shape', (s) => { s.weather.forecastProviders[0].config = [] as unknown as Record<string, unknown> }],
  ['missing location', (s) => { delete s.regions[0].coordinates; delete s.weather.weatherRegions[0].location }],
  ['invalid location', (s) => { s.weather.weatherRegions[0].location = { latitude: 91, longitude: 0 } }],
  ['broken day', (s) => { s.weather.dayRegions[0].dayId = 'missing' }],
  ['broken weather region', (s) => { s.weather.dayRegions[0].weatherRegionId = 'missing' }],
  ['duplicate day mapping', (s) => { s.weather.dayRegions.push(structuredClone(s.weather.dayRegions[0])) }],
  ['broken profile', (s) => { s.weather.weighting[0].activityProfileId = 'missing' }],
  ['zero aggregate weight', (s) => { s.weather.weighting[0].weight = 0 }],
  ['negative metric weight', (s) => { s.weather.activityProfiles[0].experience.metrics[0].weight = -1 }],
  ['duplicate metric', (s) => { s.weather.activityProfiles[0].experience.metrics.push(structuredClone(s.weather.activityProfiles[0].experience.metrics[0])) }],
  ['empty score configuration', (s) => { s.weather.activityProfiles[0].experience = { metrics: [] } }],
  ['invalid curve order', (s) => { const rule = s.weather.activityProfiles[0].experience.metrics[0]; if (rule.mode === 'linear') rule.points[1].value = rule.points[0].value }],
  ['invalid share', (s) => { s.weather.activityProfiles[0].accessShare = 1.1 }],
  ['invalid cap', (s) => { s.weather.activityProfiles[0].safetyCaps![0].maximumFinal = -1 }],
  ['invalid coverage', (s) => { s.weather.activityProfiles[0].minimumCoverage = 1.1 }],
  ['malformed alert provider', (s) => { s.weather.alertProviders[0].adapter = '' }],
  ['invalid alert adapter payload', (s) => { s.weather.alertProviders[0].config = { alerts: 'wrong' } }],
  ['broken alert region', (s) => { s.weather.alertProviders[0].weatherRegionIds = ['missing'] }],
  ['unsupported scoring schema', (s) => { s.weather.scoring.schemaVersion = 2 as 1 }],
]
for (const [label, mutate] of mutations) test(`Schema 3 rejects ${label} with structured issues`, () => {
  const snapshot = structuredClone(road); mutate(snapshot); const result = validateTripSnapshot(snapshot)
  expect(result.valid).toBe(false)
  if (!result.valid) { expect(result.reason).toBe('invalid-data'); expect(result.issues.length).toBeGreaterThan(0); expect(result.issues.every((issue) => Array.isArray(issue.path) && Boolean(issue.message))).toBe(true) }
})
test('request configuration uses weather sample location, elevation, timezone and fixed provider units', () => {
  const url = forecastURL(request)
  expect(url.origin).toBe('https://api.open-meteo.com')
  expect(url.searchParams.get('latitude')).toBe('11.1'); expect(url.searchParams.get('longitude')).toBe('11.1'); expect(url.searchParams.get('elevation')).toBe('1500')
  expect(url.searchParams.get('timezone')).toBe(road.trip.timezone); expect(url.searchParams.get('forecast_days')).toBe('5'); expect(url.searchParams.get('timeformat')).toBe('unixtime')
  const canonical = forecastRequest(city, 'city-weather')!.request
  expect(canonical.location).toEqual(city.regions[0].coordinates); expect(forecastURL(canonical).searchParams.has('elevation')).toBe(false)
  expect(url.searchParams.get('current')).toContain('visibility'); expect(url.searchParams.get('hourly')).toBe('visibility,cloud_cover,relative_humidity_2m,snow_depth')
})
test('provider normalization converts units and derives hourly daily aggregates and local noon snow', () => {
  const forecast = normalizeOpenMeteo(openMeteoResponse('2030-04-12'), { ...request, timezone: 'UTC' }, '2030-04-12T12:00:00Z')
  expect(forecast.current.metrics).toMatchObject({ temperatureC: 18, apparentC: 17, humidityPct: 65, cloudPct: 30, visibilityKm: 12, windKmh: 12, gustKmh: 24, precipitationMm: 1, snowfallCm: 2, snowDepthCm: 15, weatherCode: 2 })
  expect(forecast.daily).toHaveLength(5)
  expect(forecast.daily[0]).toMatchObject({ date: '2030-04-12', temperatureMinC: 13, temperatureMaxC: 21, visibilityMinKm: 8, visibilityMaxKm: 16, metrics: { visibilityKm: 12, cloudPct: 40, humidityPct: 60, snowDepthCm: 20, snowfallCm: 3, apparentMinC: 12, apparentMaxC: 20, windKmh: 15, gustKmh: 28 } })
})
test('nullable/missing metrics are omitted and never fabricated as zero', () => {
  const raw = openMeteoResponse('2030-04-12')
  const nullable = raw as unknown as { current: Record<string, number | null>; hourly: Record<string, (number | null)[]> }
  nullable.current.visibility = null; nullable.current.snow_depth = null
  nullable.hourly.visibility = Array(120).fill(null); nullable.hourly.snow_depth = Array(120).fill(null)
  const forecast = normalizeOpenMeteo(raw, request)
  expect(forecast.current.metrics.visibilityKm).toBeUndefined(); expect(forecast.current.metrics.snowDepthCm).toBeUndefined(); expect(forecast.daily[0].metrics.visibilityKm).toBeUndefined(); expect(forecast.daily[0].metrics.snowDepthCm).toBeUndefined()
})
for (const reason of ['wrong units', 'misaligned series', 'invalid current metric', 'duplicate forecast date'] as const) test(`normalizer safely rejects ${reason}`, () => {
  const raw = openMeteoResponse('2030-04-12')
  if (reason === 'wrong units') raw.current_units.visibility = 'km'
  if (reason === 'misaligned series') raw.hourly.visibility.pop()
  if (reason === 'invalid current metric') raw.current.relative_humidity_2m = 101
  if (reason === 'duplicate forecast date') raw.daily.time[1] = raw.daily.time[0]
  expect(() => normalizeOpenMeteo(raw, request)).toThrow()
})
test('local timezone, not UTC date, chooses the current mapped region; valid remembered selection wins', () => {
  const timestamp = Date.parse('2025-02-05T23:00:00Z'), snapshot = structuredClone(road)
  snapshot.trip.timezone = 'Pacific/Auckland'; snapshot.weather.dayRegions[1].weatherRegionId = 'road-weather-high'
  expect(localDate(timestamp / 1000, snapshot.trip.timezone)).toBe('2025-02-06')
  expect(defaultWeatherRegion(snapshot, timestamp)).toBe('road-weather-high')
  expect(defaultWeatherRegion(snapshot, timestamp, 'road-weather-low')).toBe('road-weather-low')
  expect(defaultWeatherRegion(snapshot, Date.parse('2026-01-01'), 'missing')).toBe(snapshot.weather.weatherRegions[0].id)
})
