import { test, expect } from './fixtures'
import schema3City from './fixtures/schema3-city.json' with { type: 'json' }
import schema3Road from './fixtures/schema3-road.json' with { type: 'json' }
import type { Schema3Snapshot } from '../src/data/schema/trip'
import type { ActivityProfile, OfficialAlert } from '../src/data/schema/weather'
import { scoreProfile, scoreSuitability, suitabilityLabel } from '../src/data/weather/suitability'
import { activeAlerts, demoAlertAdapter, loadAlerts } from '../src/services/weather/alerts'
const road = schema3Road as Schema3Snapshot, city = schema3City as Schema3Snapshot
const baseline = (score: number) => ({ baseline: { score, weight: 1 }, metrics: [] })
const profile = (): ActivityProfile => ({ id: 'generic-profile', label: '通用活動', weights: {}, experience: baseline(10), access: baseline(2), accessShare: .4, minimumCoverage: .6, operationNotes: [], safetyCaps: [{ accessBelow: 2.5, maximumFinal: 3.5 }] })
test('Experience and Access combine independently, then safety caps constrain excellent experience', () => {
  const p = profile(), uncapped = scoreProfile({ ...p, safetyCaps: [] }, {})
  expect(uncapped).toMatchObject({ state: 'scored', experience: 10, access: 2, final: 6.8 })
  expect(scoreProfile(p, {})).toMatchObject({ state: 'scored', experience: 10, access: 2, final: 3.5 })
  expect(scoreProfile({ ...p, accessShare: 0, safetyCaps: [] }, {})).toMatchObject({ final: 10 })
  expect(scoreProfile({ ...p, accessShare: 1, safetyCaps: [] }, {})).toMatchObject({ final: 2 })
})
test('indoor baseline remains high in rain but configured Access declines', () => {
  const indoor = city.weather.activityProfiles.find((p) => p.id === 'city-indoor')!
  const dry = scoreProfile(indoor, { precipitationMm: 0, gustKmh: 0 }), wet = scoreProfile(indoor, { precipitationMm: 25, gustKmh: 80 })
  expect(dry).toMatchObject({ experience: 9.5, access: 10 }); expect(wet).toMatchObject({ experience: 9.5, access: 0, final: 3.5 })
})
test('scenic Experience does not mask poor configured road visibility/gust/snow Access', () => {
  const driving = road.weather.activityProfiles.find((p) => p.id === 'road-driving-profile')!
  expect(scoreProfile(driving, { visibilityKm: 15, cloudPct: 0, gustKmh: 0, snowDepthCm: 0, precipitationMm: 0 })).toMatchObject({ experience: 10, access: 10, final: 10 })
  const bad = scoreProfile(driving, { visibilityKm: 15, cloudPct: 0, gustKmh: 80, snowDepthCm: 50, precipitationMm: 25 })
  expect(bad).toMatchObject({ experience: 10, access: 2.5, final: 5 })
})
test('missing metrics are excluded rather than zero and coverage is weighted separately from baseline', () => {
  const p = profile(); p.experience = { baseline: { score: 10, weight: 100 }, metrics: [{ metric: 'visibilityKm', weight: 3, mode: 'linear', points: [{ value: 0, score: 0 }, { value: 10, score: 10 }] }, { metric: 'gustKmh', weight: 1, mode: 'linear', points: [{ value: 0, score: 10 }, { value: 80, score: 0 }] }] }
  p.access = baseline(10); p.safetyCaps = []
  expect(scoreProfile(p, { visibilityKm: 10 })).toMatchObject({ state: 'scored', experience: 10, coverage: .75 })
  expect(scoreProfile(p, { gustKmh: 0 })).toMatchObject({ state: 'insufficient-data', coverage: .25 })
  expect(scoreProfile(p, {})).toMatchObject({ state: 'insufficient-data', coverage: 0 })
})
test('generic piecewise and code rules interpolate, round and exclude unmapped conditions', () => {
  const p = profile(); p.safetyCaps = []; p.access = baseline(10); p.accessShare = 0
  p.experience = { metrics: [{ metric: 'visibilityKm', weight: 1, mode: 'linear', points: [{ value: 0, score: 0 }, { value: 3, score: 10 }] }] }
  expect(scoreProfile(p, { visibilityKm: 1 })).toMatchObject({ final: 3.3 })
  expect(scoreProfile(p, { visibilityKm: 100 })).toMatchObject({ final: 10 })
  expect(scoreProfile(p, { visibilityKm: -100 })).toMatchObject({ final: 0 })
  p.experience = { metrics: [{ metric: 'weatherCode', weight: 1, mode: 'codes', scores: { '0': 10, '95': 0 } }] }
  expect(scoreProfile(p, { weatherCode: 95 })).toMatchObject({ final: 0 })
  expect(scoreProfile(p, { weatherCode: 999 })).toMatchObject({ state: 'insufficient-data' })
})
test('weighted region/day aggregates use minimum Access and conservatively retain raw safety thresholds', () => {
  const config = structuredClone(road.weather), a = profile(), b = { ...profile(), id: 'other', access: baseline(10), safetyCaps: [] }
  a.access = baseline(2.49); a.accessShare = 0
  config.activityProfiles = [a, b]; config.weighting = [{ regionId: 'region-a', activityProfileId: a.id, weight: 1 }, { regionId: 'region-a', activityProfileId: b.id, weight: 9 }, { dayId: 'day-a', activityProfileId: a.id, weight: 1 }]
  expect(scoreSuitability(config, {}, { regionId: 'region-a' })).toMatchObject({ state: 'scored', experience: 10, access: 2.5, final: 3.5 })
  expect(scoreSuitability(config, {}, { dayId: 'day-a' })).toMatchObject({ state: 'scored', final: 3.5 })
  expect(scoreSuitability(config, {}, { regionId: 'unknown' }).state).toBe('unconfigured')
  config.activityProfiles[0].access = { metrics: [{ metric: 'gustKmh', weight: 1, mode: 'linear', points: [{ value: 0, score: 10 }, { value: 80, score: 0 }] }] }
  expect(scoreSuitability(config, {}, { regionId: 'region-a' }).state).toBe('insufficient-data')
})
test('operation requirement is advisory and score labels retain text meaning', () => {
  const p = { ...profile(), operationRequired: true, operationNotes: ['查閱營運公告。'] }
  expect(scoreProfile(p, {})).toMatchObject({ operationRequired: true, notes: ['查閱營運公告。'] })
  expect([9, 8, 6.5, 5.5, 5].map((final) => suitabilityLabel({ final, access: 10 }))).toEqual(['非常理想', '適合', '可以去', '勉強可以', '不理想'])
  expect(suitabilityLabel({ final: 8, access: 1 })).toBe('到達／安全條件欠佳')
})
test('only data-selected demo alert adapter runs; all output is validated and explicitly fictional', async () => {
  const now = Date.parse('2030-04-12T12:00:00Z'), result = await loadAlerts(road.weather, now)
  expect(result.unavailable).toBe(false); expect(result.alerts).toHaveLength(1)
  expect(result.alerts[0]).toMatchObject({ isTest: true, type: 'wind', severity: 'moderate', providerId: road.weather.alertProviders[0].id, weatherRegionIds: ['road-weather-high'] })
  expect(activeAlerts(result.alerts, 'road-weather-high', now)).toHaveLength(1)
  expect(activeAlerts(result.alerts, 'road-weather-low', now)).toHaveLength(0)
  expect((await loadAlerts(city.weather, now)).alerts).toEqual([])
  const before = scoreSuitability(road.weather, { visibilityKm: 15, cloudPct: 0, gustKmh: 0, snowDepthCm: 0, precipitationMm: 0 }, { regionId: 'road-highland' })
  await loadAlerts(road.weather, now)
  expect(scoreSuitability(road.weather, { visibilityKm: 15, cloudPct: 0, gustKmh: 0, snowDepthCm: 0, precipitationMm: 0 }, { regionId: 'road-highland' })).toEqual(before)
})
test('alerts sort severity/time/id deterministically and hide expired/future/foreign-region records', () => {
  const now = Date.parse('2030-04-12T12:00:00Z')
  const alert = (id: string, severity: OfficialAlert['severity']): OfficialAlert => ({ id, severity, type: 'other', title: '虛構測試', issuedAt: '2030-04-12T10:00:00Z', expiresAt: '2030-04-12T13:00:00Z', weatherRegionIds: ['region'], providerId: 'provider', isTest: true })
  const alerts = [alert('b', 'moderate'), alert('a', 'moderate'), alert('urgent', 'extreme'), { ...alert('expired', 'extreme'), expiresAt: '2030-04-12T11:00:00Z' }, { ...alert('future', 'extreme'), effectiveAt: '2030-04-12T13:00:00Z' }, { ...alert('foreign', 'extreme'), weatherRegionIds: ['elsewhere'] }]
  expect(activeAlerts(alerts, 'region', now).map((a) => a.id)).toEqual(['urgent', 'a', 'b'])
})
test('malformed/unknown alert providers fail safely and provider region scope is enforced', async () => {
  const config = structuredClone(road.weather)
  config.alertProviders[0].adapter = 'unregistered-provider'
  expect(await loadAlerts(config)).toEqual({ alerts: [], unavailable: true })
  config.alertProviders[0].adapter = 'demo-alerts'; config.alertProviders[0].config = { alerts: 'invalid' }
  expect(await loadAlerts(config)).toEqual({ alerts: [], unavailable: true })
  config.alertProviders[0].config = road.weather.alertProviders[0].config
  config.alertProviders[0].weatherRegionIds = ['road-weather-low']
  expect(await loadAlerts(config)).toEqual({ alerts: [], unavailable: true })
  await expect(demoAlertAdapter({ ...config.alertProviders[0], config: { alerts: [{ durationHours: -1 }] } }, Date.now())).rejects.toThrow()
})
