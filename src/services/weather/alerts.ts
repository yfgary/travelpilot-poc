import { z } from 'zod'
import { alertSeverities, demoAlertConfigurationSchema, officialAlertSchema, type OfficialAlert, type WeatherConfiguration } from '../../data/schema/weather'
type Provider = WeatherConfiguration['alertProviders'][number]
export type AlertAdapter = (provider: Provider, now: number) => Promise<OfficialAlert[]>
export const demoAlertAdapter: AlertAdapter = async (provider, now) => {
  const seeds = demoAlertConfigurationSchema.parse(provider.config ?? { alerts: [] })
  return seeds.alerts.map((seed) => officialAlertSchema.parse({
    id: seed.id, type: seed.type, severity: seed.severity, title: seed.title, description: seed.description, instruction: seed.instruction, weatherRegionIds: seed.weatherRegionIds,
    providerId: provider.id, providerLabel: provider.label ?? 'POC 虛構警告資料', officialUrl: seed.officialUrl,
    issuedAt: new Date(now).toISOString(), effectiveAt: new Date(now).toISOString(), expiresAt: new Date(now + seed.durationHours * 3600000).toISOString(), isTest: true,
  }))
}
const registry: Readonly<Record<string, AlertAdapter>> = { 'demo-alerts': demoAlertAdapter }
export function activeAlerts(alerts: OfficialAlert[], weatherRegionId: string, now = Date.now()): OfficialAlert[] {
  return alerts.filter((alert) => alert.weatherRegionIds.includes(weatherRegionId) && Date.parse(alert.issuedAt) <= now && (!alert.effectiveAt || Date.parse(alert.effectiveAt) <= now) && (!alert.expiresAt || Date.parse(alert.expiresAt) > now)).sort((a, b) => alertSeverities.indexOf(b.severity) - alertSeverities.indexOf(a.severity) || Date.parse(b.issuedAt) - Date.parse(a.issuedAt) || a.id.localeCompare(b.id))
}
export async function loadAlerts(config: WeatherConfiguration, now = Date.now()): Promise<{ alerts: OfficialAlert[]; unavailable: boolean }> {
  let unavailable = false
  const results = await Promise.all(config.alertProviders.map(async (provider) => {
    if (!Object.hasOwn(registry, provider.adapter)) { unavailable = true; return [] }
    try {
      const alerts = z.array(officialAlertSchema).parse(await registry[provider.adapter](provider, now))
      const allowed = provider.weatherRegionIds ?? config.weatherRegions.map((region) => region.id)
      if (new Set(alerts.map((alert) => alert.id)).size !== alerts.length || alerts.some((alert) => alert.providerId !== provider.id || alert.weatherRegionIds.some((id) => !allowed.includes(id)))) throw new Error('Alert identity mismatch')
      return alerts
    } catch { unavailable = true; return [] }
  }))
  return { alerts: results.flat(), unavailable }
}
