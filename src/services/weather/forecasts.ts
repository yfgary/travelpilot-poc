import type { WeatherSnapshot } from '../../data/schema/trip'
import { weatherForecastSchema, type WeatherForecast } from '../../data/schema/weather'
import { readWeatherCache, writeWeatherCache } from '../../offline/weatherCache'
import { openMeteoAdapter, type ForecastAdapter, type ForecastRequest } from './providers/openMeteo'
export const FORECAST_TTL_MS = 10 * 60 * 1000
const adapters: Readonly<Record<string, ForecastAdapter>> = { 'open-meteo': openMeteoAdapter }
export type ForecastResult = { state: 'ready'; forecast: WeatherForecast; source: 'remote' | 'cache'; stale: boolean; cacheSaved: boolean } | { state: 'unavailable' } | { state: 'unconfigured' } | { state: 'loading' }
const pending = new Map<string, Promise<ForecastResult>>()
const memory = new Map<string, { forecast: WeatherForecast; saved: boolean }>()
export function forecastRequest(snapshot: WeatherSnapshot, weatherRegionId: string): { request: ForecastRequest; adapter: string; signature: string } | null {
  const region = snapshot.weather.weatherRegions.find((region) => region.id === weatherRegionId)
  const provider = snapshot.weather.forecastProviders.find((provider) => provider.id === region?.providerId)
  const canonical = snapshot.regions.find((item) => item.id === region?.regionId)
  const location = region?.location ?? canonical?.coordinates
  if (!region || !provider || !location) return null
  const request = { tripId: snapshot.trip.id, weatherRegionId, providerId: provider.id, timezone: canonical?.timezone ?? snapshot.trip.timezone, location, config: provider.config }
  return { request, adapter: provider.adapter, signature: JSON.stringify([provider.adapter, location, request.timezone, provider.config ?? {}]) }
}
export async function loadForecast(snapshot: WeatherSnapshot, weatherRegionId: string, options: { online: boolean; force?: boolean; now?: number }): Promise<ForecastResult> {
  const context = forecastRequest(snapshot, weatherRegionId)
  if (!context || !Object.hasOwn(adapters, context.adapter)) return { state: 'unconfigured' }
  const { request, signature } = context, key: [string, string, string] = [request.tripId, request.weatherRegionId, request.providerId], token = JSON.stringify([key, signature])
  const existing = pending.get(token)
  if (existing) return existing
  const task = (async (): Promise<ForecastResult> => {
    const stored = await readWeatherCache(key, signature), inMemory = memory.get(token)
    const cached = stored ?? inMemory?.forecast ?? null, saved = Boolean(stored) || Boolean(inMemory?.saved)
    const now = options.now ?? Date.now(), age = cached ? now - Date.parse(cached.fetchedAt) : Infinity
    const fresh = age >= 0 && age < FORECAST_TTL_MS
    if (cached && (!options.online || (fresh && !options.force))) return { state: 'ready', forecast: cached, source: 'cache', stale: !options.online || !fresh, cacheSaved: saved }
    if (!options.online) return { state: 'unavailable' }
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 15000)
    try {
      const forecast = weatherForecastSchema.parse(await adapters[context.adapter](request, controller.signal))
      if (forecast.tripId !== key[0] || forecast.weatherRegionId !== key[1] || forecast.providerId !== key[2] || forecast.timezone !== request.timezone) throw new Error('Forecast identity mismatch')
      const cacheSaved = await writeWeatherCache(forecast, signature)
      memory.set(token, { forecast, saved: cacheSaved })
      return { state: 'ready', forecast, source: 'remote', stale: false, cacheSaved }
    } catch { return cached ? { state: 'ready', forecast: cached, source: 'cache', stale: true, cacheSaved: saved } : { state: 'unavailable' } }
    finally { clearTimeout(timer) }
  })()
  pending.set(token, task)
  try { return await task } finally { if (pending.get(token) === task) pending.delete(token) }
}
