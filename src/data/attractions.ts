import type { TripSnapshot } from './schema/trip'
import type { Place, TripDay } from './itinerary'

export const usageLabels = { main: '主行程', optional: '可選／Bonus', backup: '備用' } as const
export type PlaceStatus = keyof typeof usageLabels
export type PlaceUsage = { place: Place; occurrences: { day: TripDay; status: PlaceStatus }[]; days: TripDay[]; statuses: PlaceStatus[] }
const priority: Record<PlaceStatus, number> = { main: 0, optional: 1, backup: 2 }

// Derived relationships only: never annotate or mutate canonical Places/Days.
export function derivePlaceUsage(snapshot: TripSnapshot): PlaceUsage[] {
  const occurrences = new Map<string, Map<string, { day: TripDay; status: PlaceStatus }>>()
  function add(placeId: string | undefined, day: TripDay, status: PlaceStatus) {
    if (!placeId) return
    const values = occurrences.get(placeId) ?? new Map()
    values.set(`${day.id}:${status}`, { day, status }); occurrences.set(placeId, values)
  }
  for (const day of snapshot.days) {
    for (const item of day.timeline) add(item.placeId, day, item.optional || item.bonus ? 'optional' : 'main')
    for (const ref of day.optionalContent) if (ref.type === 'place') add(ref.id, day, 'optional')
    for (const ref of day.backupContent) if (ref.type === 'place') add(ref.id, day, 'backup')
  }
  return snapshot.places.flatMap((place) => {
    const values = occurrences.get(place.id)
    if (!values) return []
    const items = [...values.values()].sort((a, b) => a.day.dayNumber - b.day.dayNumber || priority[a.status] - priority[b.status])
    return [{ place, occurrences: items, days: [...new Map(items.map((item) => [item.day.id, item.day])).values()], statuses: [...new Set(items.map((item) => item.status))].sort((a, b) => priority[a] - priority[b]) }]
  }).sort((a, b) => a.days[0].dayNumber - b.days[0].dayNumber || priority[a.statuses[0]] - priority[b.statuses[0]] || a.place.name.localeCompare(b.place.name, 'zh-HK') || a.place.id.localeCompare(b.place.id))
}
export function placeUsageCounts(usage: PlaceUsage[]) {
  return { all: usage.length, main: usage.filter((item) => item.statuses.includes('main')).length, optional: usage.filter((item) => item.statuses.includes('optional')).length, backup: usage.filter((item) => item.statuses.includes('backup')).length }
}
export function groupPlaceUsage(snapshot: TripSnapshot, usage: PlaceUsage[], filter: PlaceStatus | 'all') {
  const matching = usage.filter((item) => filter === 'all' || item.statuses.includes(filter))
  const groups = snapshot.regions.map((region) => ({ id: region.id, label: region.label ?? region.name, places: matching.filter((item) => item.place.regionId === region.id) })).filter((group) => group.places.length)
  const unmapped = matching.filter((item) => !snapshot.regions.some((region) => region.id === item.place.regionId))
  return unmapped.length ? [...groups, { id: '__unmapped', label: '其他地區', places: unmapped }] : groups
}
