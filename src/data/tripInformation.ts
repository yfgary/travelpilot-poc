import type { TripSnapshot } from './schema/trip'
import { calendarDate, formatTripDate } from './tripDates'
import type { HardCut, NavigationTarget, TripDay } from './itinerary'
import { calendarInstant, tripTime } from './tripTime'

export const navigationTypes: Record<NavigationTarget['type'], string> = {
  parking: '🅿 泊車', entrance: '入口', station: '車站', pickup: '接載', dropoff: '落客', other: '其他導航',
}
export type EmergencyContact = NonNullable<ReturnType<typeof import('./schema/trip').getEmergencyInfo>>['contacts'][number]
export const emergencyTypes: Record<EmergencyContact['type'], string> = {
  police: '警察／保安', ambulance: '救護', fire: '消防', medical: '醫療', roadside: '道路支援',
  embassy: '大使館', consulate: '領事館', insurance: '保險', accommodation: '住宿支援', other: '其他支援',
}
function timeInZone(date: Date, timezone: string) {
  return tripTime(date, timezone)
}
export function formatTransportDateTime(value: string | undefined, timezone: string) {
  if (!value) return undefined
  const date = new Date(value)
  return `${formatTripDate(calendarDate(date, timezone))} ${timeInZone(date, timezone)}`
}
export function phoneAction(phone: string | undefined) {
  const value = phone?.trim()
  return value && /^\+?\d[\d ()-]*$/.test(value) ? `tel:${value.replace(/[ ()-]/g, '')}` : undefined
}
export function orderedDefinitions<T extends { id: string; order: number }>(records: readonly T[]): T[] {
  return [...records].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id, 'en'))
}

// Resolve a day/time in the trip's IANA timezone, rather than assuming UTC.
// Datetime hard cuts already contain their offset and are compared as instants.
export function hardCutInstant(cut: HardCut, snapshot: TripSnapshot, linkedDay?: TripDay): number | undefined {
  if (cut.datetime) return Date.parse(cut.datetime)
  const day = snapshot.days.find((day) => day.id === cut.dayId) ?? linkedDay
  if (!day || !cut.time) return undefined
  return calendarInstant(day.date, cut.time, snapshot.trip.timezone)
}
export function sortedHardCuts(snapshot: TripSnapshot): HardCut[] {
  return [...snapshot.hardCuts].sort((a, b) => {
    const first = hardCutInstant(a, snapshot), second = hardCutInstant(b, snapshot)
    return (first ?? Infinity) - (second ?? Infinity) || a.id.localeCompare(b.id, 'en')
  })
}
