import { z } from 'zod'
import { weatherForecastSchema, type WeatherForecast, type WeatherMetrics } from '../../../data/schema/weather'

export type ForecastRequest = { tripId: string; weatherRegionId: string; providerId: string; timezone: string; location: { latitude: number; longitude: number; elevationM?: number }; config?: Record<string, unknown> }
export type ForecastAdapter = (request: ForecastRequest, signal: AbortSignal) => Promise<WeatherForecast>
const number = z.number().finite().nullable()
const series = z.array(number)
const rawSchema = z.object({
  current: z.object({ time: z.number().finite() }).catchall(number),
  current_units: z.record(z.string(), z.string()),
  hourly: z.object({ time: z.array(z.number().finite()).min(1), visibility: series, cloud_cover: series, relative_humidity_2m: series, snow_depth: series }),
  hourly_units: z.record(z.string(), z.string()),
  daily: z.object({ time: z.array(z.number().finite()).length(5), weather_code: series, temperature_2m_max: series, temperature_2m_min: series, apparent_temperature_max: series, apparent_temperature_min: series, precipitation_probability_max: series, precipitation_sum: series, snowfall_sum: series, wind_speed_10m_max: series, wind_gusts_10m_max: series }),
  daily_units: z.record(z.string(), z.string()),
}).superRefine((raw, ctx) => {
  for (const field of ['visibility', 'snow_depth'] as const) if (raw.hourly[field].some((value) => value !== null && value < 0)) ctx.addIssue({ code: 'custom', message: 'Invalid hourly metric' })
  for (const field of ['cloud_cover', 'relative_humidity_2m'] as const) if (raw.hourly[field].some((value) => value !== null && (value < 0 || value > 100))) ctx.addIssue({ code: 'custom', message: 'Invalid hourly percentage' })
  for (const key of ['hourly', 'daily'] as const) {
    const block = raw[key]
    if (!block.time.every((value, i) => i === 0 || value > block.time[i - 1])) ctx.addIssue({ code: 'custom', message: 'Nonchronological provider times' })
    for (const values of Object.values(block)) if (values.length !== block.time.length) ctx.addIssue({ code: 'custom', message: 'Misaligned provider series' })
  }
})
export function localDate(epochSeconds: number, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(epochSeconds * 1000))
  const get = (key: string) => parts.find((part) => part.type === key)!.value
  return `${get('year')}-${get('month')}-${get('day')}`
}
const currentFields: [keyof WeatherMetrics, string, number][] = [
  ['temperatureC', 'temperature_2m', 1], ['apparentC', 'apparent_temperature', 1], ['humidityPct', 'relative_humidity_2m', 1], ['cloudPct', 'cloud_cover', 1], ['visibilityKm', 'visibility', .001], ['windKmh', 'wind_speed_10m', 1], ['gustKmh', 'wind_gusts_10m', 1], ['precipitationMm', 'precipitation', 1], ['precipitationProbabilityPct', 'precipitation_probability', 1], ['snowfallCm', 'snowfall', 1], ['snowDepthCm', 'snow_depth', 100], ['weatherCode', 'weather_code', 1],
]
const dailyFields: [keyof WeatherMetrics, string][] = [['weatherCode', 'weather_code'], ['apparentMinC', 'apparent_temperature_min'], ['apparentMaxC', 'apparent_temperature_max'], ['precipitationProbabilityPct', 'precipitation_probability_max'], ['precipitationMm', 'precipitation_sum'], ['snowfallCm', 'snowfall_sum'], ['windKmh', 'wind_speed_10m_max'], ['gustKmh', 'wind_gusts_10m_max']]
const value = (input: unknown, factor = 1) => typeof input === 'number' && Number.isFinite(input) ? input * factor : undefined
const mean = (values: number[]) => values.length ? values.reduce((a, b) => a + b, 0) / values.length : undefined
export function forecastURL(request: ForecastRequest) {
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  const params = { latitude: request.location.latitude, longitude: request.location.longitude, timezone: request.timezone, forecast_days: 5, timeformat: 'unixtime', temperature_unit: 'celsius', wind_speed_unit: 'kmh', precipitation_unit: 'mm', current: currentFields.map(([, field]) => field).join(','), hourly: 'visibility,cloud_cover,relative_humidity_2m,snow_depth', daily: 'weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_probability_max,precipitation_sum,snowfall_sum,wind_speed_10m_max,wind_gusts_10m_max' }
  for (const [key, entry] of Object.entries(params)) url.searchParams.set(key, String(entry))
  if (request.location.elevationM !== undefined) url.searchParams.set('elevation', String(request.location.elevationM))
  return url
}
export function normalizeOpenMeteo(input: unknown, request: ForecastRequest, fetchedAt = new Date().toISOString()): WeatherForecast {
  const raw = rawSchema.parse(input)
  // Reject unit changes rather than silently interpreting another unit system.
  for (const [units, expected] of [
    [raw.current_units, { temperature_2m: '°C', apparent_temperature: '°C', visibility: 'm', wind_speed_10m: 'km/h', wind_gusts_10m: 'km/h', precipitation: 'mm', snowfall: 'cm', snow_depth: 'm', relative_humidity_2m: '%', cloud_cover: '%', precipitation_probability: '%' }],
    [raw.hourly_units, { visibility: 'm', snow_depth: 'm', cloud_cover: '%', relative_humidity_2m: '%' }],
    [raw.daily_units, { temperature_2m_min: '°C', temperature_2m_max: '°C', apparent_temperature_min: '°C', apparent_temperature_max: '°C', precipitation_sum: 'mm', snowfall_sum: 'cm', wind_speed_10m_max: 'km/h', wind_gusts_10m_max: 'km/h', precipitation_probability_max: '%' }],
  ] as const) for (const [field, unit] of Object.entries(expected)) if (units[field] !== unit) throw new Error('Unsupported provider units')
  const metrics: WeatherMetrics = {}
  for (const [key, field, factor] of currentFields) metrics[key] = value(raw.current[field], factor)
  metrics.apparentMinC = metrics.apparentC; metrics.apparentMaxC = metrics.apparentC
  const hourlyDates = raw.hourly.time.map((epoch) => localDate(epoch, request.timezone))
  const daily = raw.daily.time.map((epoch, index) => {
    const date = localDate(epoch, request.timezone), metrics: WeatherMetrics = {}
    for (const [key, field] of dailyFields) metrics[key] = value(raw.daily[field as keyof typeof raw.daily][index])
    metrics.apparentC = metrics.apparentMinC !== undefined && metrics.apparentMaxC !== undefined ? (metrics.apparentMinC + metrics.apparentMaxC) / 2 : undefined
    const indices = raw.hourly.time.flatMap((_, i) => hourlyDates[i] === date ? [i] : [])
    const samples = (key: 'visibility' | 'cloud_cover' | 'relative_humidity_2m') => indices.flatMap((i) => { const sample = value(raw.hourly[key][i]); return sample === undefined ? [] : [sample] })
    const visibility = samples('visibility').map((sample) => sample / 1000)
    metrics.visibilityKm = mean(visibility); metrics.cloudPct = mean(samples('cloud_cover')); metrics.humidityPct = mean(samples('relative_humidity_2m'))
    const hour = (i: number) => Number(new Intl.DateTimeFormat('en', { timeZone: request.timezone, hour: '2-digit', hourCycle: 'h23' }).format(new Date(raw.hourly.time[i] * 1000)))
    const noon = [...indices].filter((i) => raw.hourly.snow_depth[i] !== null && Math.abs(hour(i) - 12) <= 2).sort((a, b) => Math.abs(hour(a) - 12) - Math.abs(hour(b) - 12))[0]
    metrics.snowDepthCm = noon === undefined ? undefined : value(raw.hourly.snow_depth[noon], 100)
    return { date, metrics, temperatureMinC: value(raw.daily.temperature_2m_min[index]), temperatureMaxC: value(raw.daily.temperature_2m_max[index]), visibilityMinKm: visibility.length ? Math.min(...visibility) : undefined, visibilityMaxKm: visibility.length ? Math.max(...visibility) : undefined }
  })
  return weatherForecastSchema.parse({ tripId: request.tripId, weatherRegionId: request.weatherRegionId, providerId: request.providerId, timezone: request.timezone, fetchedAt, current: { observedAt: new Date(raw.current.time * 1000).toISOString(), metrics }, daily, attribution: { label: 'Open-Meteo', url: 'https://open-meteo.com/' } })
}
export const openMeteoAdapter: ForecastAdapter = async (request, signal) => {
  const response = await fetch(forecastURL(request), { signal })
  if (!response.ok) throw new Error('Forecast unavailable')
  return normalizeOpenMeteo(await response.json(), request)
}
