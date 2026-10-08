import type { ActivityProfile, WeatherConfiguration, WeatherMetrics } from '../schema/weather'
export type ProfileScore = { state: 'scored'; id: string; label: string; experience: number; access: number; unroundedAccess: number; final: number; coverage: number; operationRequired: boolean; notes: string[] } | { state: 'insufficient-data'; id: string; label: string; coverage: number }
export type Suitability = { state: 'scored'; experience: number; access: number; final: number; profiles: ProfileScore[]; operationRequired: boolean; notes: string[] } | { state: 'insufficient-data'; profiles: ProfileScore[]; operationRequired: boolean } | { state: 'unconfigured'; profiles: ProfileScore[] }
const clamp = (value: number) => Math.min(10, Math.max(0, value))
const round = (value: number) => Math.round(clamp(value) * 10) / 10
function evaluatePart(part: ActivityProfile['experience'], metrics: WeatherMetrics) {
  let total = part.baseline ? part.baseline.score * part.baseline.weight : 0, weight = part.baseline?.weight ?? 0, available = 0, configured = 0
  for (const rule of part.metrics) {
    configured += rule.weight
    const raw = metrics[rule.metric]
    if (raw === undefined || !Number.isFinite(raw)) continue
    let score: number | undefined
    if (rule.mode === 'codes') score = rule.scores[String(raw)]
    else {
      const points = rule.points
      if (raw <= points[0].value) score = points[0].score
      else if (raw >= points[points.length - 1].value) score = points[points.length - 1].score
      else { const upper = points.findIndex((point) => point.value > raw), a = points[upper - 1], b = points[upper]; score = a.score + (b.score - a.score) * (raw - a.value) / (b.value - a.value) }
    }
    if (score === undefined) continue
    available += rule.weight; weight += rule.weight; total += clamp(score) * rule.weight
  }
  return { score: weight > 0 ? total / weight : undefined, coverage: configured ? available / configured : 1 }
}
function cap(final: number, access: number, caps: ActivityProfile['safetyCaps']) { for (const entry of caps ?? []) if (access < entry.accessBelow) final = Math.min(final, entry.maximumFinal); return final }
export function scoreProfile(profile: ActivityProfile, metrics: WeatherMetrics): ProfileScore {
  const experience = evaluatePart(profile.experience, metrics), access = evaluatePart(profile.access, metrics), coverage = Math.min(experience.coverage, access.coverage)
  if (coverage < (profile.minimumCoverage ?? .6) || experience.score === undefined || access.score === undefined) return { state: 'insufficient-data', id: profile.id, label: profile.label, coverage }
  const final = cap(experience.score * (1 - profile.accessShare) + access.score * profile.accessShare, access.score, profile.safetyCaps)
  return { state: 'scored', id: profile.id, label: profile.label, experience: round(experience.score), access: round(access.score), unroundedAccess: access.score, final: round(final), coverage, operationRequired: profile.operationRequired ?? false, notes: profile.operationNotes }
}
export function scoreSuitability(config: WeatherConfiguration, metrics: WeatherMetrics, scope: { regionId?: string; dayId?: string }): Suitability {
  const weights = config.weighting.filter((entry) => scope.dayId ? entry.dayId === scope.dayId : entry.regionId === scope.regionId && !entry.dayId)
  const contributions = weights.flatMap((entry) => { const profile = config.activityProfiles.find((profile) => profile.id === entry.activityProfileId); return profile ? [{ profile, weight: entry.weight, score: scoreProfile(profile, metrics) }] : [] })
  const profiles = contributions.map((entry) => entry.score)
  if (!contributions.length) return { state: 'unconfigured', profiles }
  if (profiles.some((profile) => profile.state !== 'scored')) return { state: 'insufficient-data', profiles, operationRequired: contributions.some((entry) => entry.profile.operationRequired) }
  let experience = 0, final = 0, total = 0, access = 10
  for (const entry of contributions) if (entry.score.state === 'scored') { experience += entry.score.experience * entry.weight; final += entry.score.final * entry.weight; total += entry.weight; access = Math.min(access, entry.score.unroundedAccess) }
  final /= total
  for (const entry of contributions) final = cap(final, access, entry.profile.safetyCaps)
  return { state: 'scored', experience: round(experience / total), access: round(access), final: round(final), profiles, operationRequired: contributions.some((entry) => entry.profile.operationRequired), notes: [...new Set(contributions.flatMap((entry) => entry.profile.operationNotes))] }
}
export function suitabilityLabel(score: { final: number; access: number }) { return score.access < 2.5 ? '到達／安全條件欠佳' : score.final >= 9 ? '非常理想' : score.final >= 8 ? '適合' : score.final >= 6.5 ? '可以去' : score.final >= 5.5 ? '勉強可以' : '不理想' }
