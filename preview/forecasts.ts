import type { WeatherSnapshot } from '../src/data/schema/trip'
import { weatherForecastSchema } from '../src/data/schema/weather'
import { writeWeatherCache } from '../src/offline/weatherCache'
import type { ForecastResult as NormalForecastResult } from '../src/services/weather/forecasts'
export const FORECAST_TTL_MS = 10 * 60 * 1000
export type ForecastResult = Exclude<NormalForecastResult, { state: 'ready' }> | (Omit<Extract<NormalForecastResult, { state: 'ready' }>, 'source'> & { source: 'fixture' })
// Dates and values never follow the device clock or trigger a provider request.
export const sample = {
  fetchedAt: '2026-10-16T00:00:00Z',
  dates: ['2026-10-16', '2026-10-17', '2026-10-18', '2026-10-19', '2026-10-20'],
  metrics: { temperatureC: 18, apparentC: 17, apparentMinC: 12, apparentMaxC: 20, humidityPct: 65, cloudPct: 30, visibilityKm: 12, windKmh: 12, gustKmh: 24, precipitationMm: 1, precipitationProbabilityPct: 20, snowfallCm: 2, snowDepthCm: 15, weatherCode: 2 },
}
export async function loadForecast(snapshot: WeatherSnapshot, weatherRegionId: string): Promise<ForecastResult> {
  const region = snapshot.weather.weatherRegions.find(item => item.id === weatherRegionId)
  const canonical = snapshot.regions.find(item => item.id === region?.regionId)
  if (!region) return { state: 'unconfigured' }
  const forecast = weatherForecastSchema.parse({ tripId: snapshot.trip.id, weatherRegionId, providerId: region.providerId, timezone: canonical?.timezone ?? snapshot.trip.timezone,
    fetchedAt: sample.fetchedAt, current: { observedAt: sample.fetchedAt, metrics: sample.metrics },
    daily: sample.dates.map(date => ({ date, metrics: sample.metrics, temperatureMinC: 13, temperatureMaxC: 21, visibilityMinKm: 10, visibilityMaxKm: 15 })),
    attribution: { label: 'SIMULATED 固定樣本（非即時、非真實 2027 預報）', url: new URL(import.meta.env.BASE_URL, window.location.origin).href },
  })
  const cacheSaved = await writeWeatherCache(forecast, 'isolated-preview-fixed-sample-v1')
  return { state: 'ready', forecast, source: 'fixture', stale: false, cacheSaved }
}
