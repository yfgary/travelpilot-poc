import { z } from 'zod'

const id = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
const text = z.string().min(1)
const score = z.number().finite().min(0).max(10)
const positive = z.number().finite().positive()
const nonnegative = z.number().finite().nonnegative()
const percentage = z.number().finite().min(0).max(100)
const url = z.url().refine((value) => /^https?:\/\//.test(value))
const datetime = z.iso.datetime({ offset: true })
const notes = z.array(text)
const config = z.record(text, z.unknown()).superRefine((value, ctx) => {
  let nodes = 0
  function visit(item: unknown, depth: number) {
    if (++nodes > 2000 || depth > 10) { ctx.addIssue({ code: 'custom', message: 'Configuration too complex' }); return }
    if (item !== null && typeof item !== 'string' && typeof item !== 'number' && typeof item !== 'boolean' && typeof item !== 'object') ctx.addIssue({ code: 'custom', message: 'Configuration must be JSON' })
    if (typeof item === 'number' && !Number.isFinite(item)) ctx.addIssue({ code: 'custom', message: 'Configuration must be finite' })
    if (typeof item === 'string' && item.length > 4000) ctx.addIssue({ code: 'custom', message: 'Configuration value too long' })
    if (item && typeof item === 'object' && !Array.isArray(item) && Object.getPrototypeOf(item) !== Object.prototype && Object.getPrototypeOf(item) !== null) ctx.addIssue({ code: 'custom', message: 'Configuration must contain plain JSON objects' })
    if (item && typeof item === 'object') for (const [key, child] of Object.entries(item)) {
      if (/^(?:__proto__|prototype|constructor|password|secret|apiKey|token|service_role)$/i.test(key)) ctx.addIssue({ code: 'custom', message: 'Unsafe configuration key' })
      visit(child, depth + 1)
    }
  }
  visit(value, 0)
})
export const metricNames = ['temperatureC', 'apparentC', 'apparentMinC', 'apparentMaxC', 'humidityPct', 'cloudPct', 'visibilityKm', 'windKmh', 'gustKmh', 'precipitationMm', 'precipitationProbabilityPct', 'snowfallCm', 'snowDepthCm', 'weatherCode'] as const
const linearRule = z.strictObject({ metric: z.enum(metricNames), weight: positive, mode: z.literal('linear'), points: z.array(z.strictObject({ value: z.number().finite(), score })).min(2) }).refine((rule) => rule.points.every((point, i) => i === 0 || point.value > rule.points[i - 1].value), 'Curve points must strictly increase')
const codeRule = z.strictObject({ metric: z.literal('weatherCode'), weight: positive, mode: z.literal('codes'), scores: z.record(z.string().regex(/^\d+$/), score).refine((values) => Object.keys(values).length > 0) })
const scorePart = z.strictObject({ baseline: z.strictObject({ score, weight: positive }).optional(), metrics: z.array(z.discriminatedUnion('mode', [linearRule, codeRule])) }).superRefine((part, ctx) => {
  if (!part.baseline && !part.metrics.length) ctx.addIssue({ code: 'custom', message: 'Score part requires a baseline or metrics' })
  if (new Set(part.metrics.map((rule) => rule.metric)).size !== part.metrics.length) ctx.addIssue({ code: 'custom', message: 'Duplicate score metric' })
})
export const activityProfileSchema = z.strictObject({
  id, label: text, icon: text.optional(), weights: z.record(text, nonnegative),
  experience: scorePart, access: scorePart, accessShare: z.number().min(0).max(1),
  safetyCaps: z.array(z.strictObject({ accessBelow: score, maximumFinal: score })).optional(),
  operationRequired: z.boolean().optional(), operationNotes: notes, minimumCoverage: z.number().min(0).max(1).optional(),
})
export const alertTypes = ['wind', 'heavy_rain', 'snow', 'flood', 'thunderstorm', 'earthquake', 'tsunami', 'volcano', 'heat', 'cold', 'other'] as const
export const alertSeverities = ['info', 'minor', 'moderate', 'severe', 'extreme'] as const
export const demoAlertConfigurationSchema = z.strictObject({ alerts: z.array(z.strictObject({
  id, type: z.enum(alertTypes), severity: z.enum(alertSeverities), title: text,
  description: text.optional(), instruction: text.optional(), weatherRegionIds: z.array(id).min(1),
  officialUrl: url.optional(), durationHours: z.number().positive().max(168),
})) })
export const weatherConfigurationSchema = z.strictObject({
  forecastProviders: z.array(z.strictObject({ id, adapter: text, label: text.optional(), config: config.optional() })),
  weatherRegions: z.array(z.strictObject({ id, regionId: id, label: text, providerId: id, coordinates: z.strictObject({ latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180) }).optional(), provider: text.optional(), location: z.strictObject({ latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180), elevationM: z.number().finite().optional() }).optional(), operationNotes: notes })),
  activityProfiles: z.array(activityProfileSchema),
  weighting: z.array(z.strictObject({ regionId: id.optional(), dayId: id.optional(), activityProfileId: id, weight: positive }).refine((entry) => Boolean(entry.regionId) !== Boolean(entry.dayId), 'Weighting requires exactly one region or day')),
  dayRegions: z.array(z.strictObject({ dayId: id, weatherRegionId: id })),
  scoring: z.strictObject({ schemaVersion: z.literal(1), config: z.record(text, nonnegative) }), operationNotes: notes,
  alertProviders: z.array(z.strictObject({ id, adapter: text, label: text.optional(), weatherRegionIds: z.array(id).optional(), config: config.optional() })),
}).superRefine((weather, ctx) => {
  // Known adapter contracts are selected by adapter ID, never geography.
  const contracts = { 'demo-alerts': demoAlertConfigurationSchema }
  weather.alertProviders.forEach((provider, index) => {
    if (!Object.hasOwn(contracts, provider.adapter)) return
    const result = contracts[provider.adapter as keyof typeof contracts].safeParse(provider.config ?? { alerts: [] })
    if (!result.success) { ctx.addIssue({ code: 'custom', path: ['alertProviders', index, 'config'], message: 'Invalid adapter configuration' }); return }
    const allowed = provider.weatherRegionIds ?? weather.weatherRegions.map((region) => region.id)
    if (new Set(result.data.alerts.map((alert) => alert.id)).size !== result.data.alerts.length || result.data.alerts.some((alert) => alert.weatherRegionIds.some((id) => !allowed.includes(id)))) ctx.addIssue({ code: 'custom', path: ['alertProviders', index, 'config'], message: 'Invalid alert identity or region scope' })
  })
})
export type WeatherConfiguration = z.infer<typeof weatherConfigurationSchema>
export type ActivityProfile = z.infer<typeof activityProfileSchema>
export const weatherMetricsSchema = z.strictObject({
  temperatureC: z.number().finite().optional(), apparentC: z.number().finite().optional(),
  apparentMinC: z.number().finite().optional(), apparentMaxC: z.number().finite().optional(),
  humidityPct: percentage.optional(), cloudPct: percentage.optional(), visibilityKm: nonnegative.optional(),
  windKmh: nonnegative.optional(), gustKmh: nonnegative.optional(), precipitationMm: nonnegative.optional(),
  precipitationProbabilityPct: percentage.optional(), snowfallCm: nonnegative.optional(), snowDepthCm: nonnegative.optional(),
  weatherCode: z.number().int().nonnegative().optional(),
})
const dailySchema = z.strictObject({ date: z.iso.date(), metrics: weatherMetricsSchema, temperatureMinC: z.number().finite().optional(), temperatureMaxC: z.number().finite().optional(), visibilityMinKm: nonnegative.optional(), visibilityMaxKm: nonnegative.optional() }).refine((day) => day.temperatureMinC === undefined || day.temperatureMaxC === undefined || day.temperatureMinC <= day.temperatureMaxC, 'Invalid temperature range')
export const weatherForecastSchema = z.strictObject({
  tripId: id, weatherRegionId: id, providerId: id, timezone: text.refine((value) => { try { new Intl.DateTimeFormat('en', { timeZone: value }); return true } catch { return false } }), fetchedAt: datetime,
  current: z.strictObject({ observedAt: datetime, metrics: weatherMetricsSchema }), daily: z.array(dailySchema).length(5),
  attribution: z.strictObject({ label: text, url }),
}).refine((forecast) => forecast.daily.every((day, i) => i === 0 || day.date > forecast.daily[i - 1].date), 'Forecast dates must strictly increase')
export type WeatherMetrics = z.infer<typeof weatherMetricsSchema>
export type WeatherForecast = z.infer<typeof weatherForecastSchema>
export const officialAlertSchema = z.strictObject({
  id, type: z.enum(alertTypes), severity: z.enum(alertSeverities), urgency: text.optional(), certainty: text.optional(),
  title: text, description: text.optional(), instruction: text.optional(), issuedAt: datetime, effectiveAt: datetime.optional(), expiresAt: datetime.optional(),
  weatherRegionIds: z.array(id).min(1), providerId: id, providerLabel: text.optional(), officialUrl: url.optional(), isTest: z.boolean(),
}).refine((alert) => !alert.expiresAt || Date.parse(alert.expiresAt) > Date.parse(alert.effectiveAt ?? alert.issuedAt), 'Invalid alert expiry')
export type OfficialAlert = z.infer<typeof officialAlertSchema>
