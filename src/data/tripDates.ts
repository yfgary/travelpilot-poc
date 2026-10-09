import type { TripSnapshot, TripSummary } from './schema/trip'
import { activeExactDay } from './operationalTiming'

export type TripStatus = 'current' | 'upcoming' | 'completed'
type DatedTrip = Pick<TripSummary, 'slug' | 'startDate' | 'endDate' | 'timezone'>
export const tripStatusLabels: Record<TripStatus, string> = {
  current: '旅程進行中', upcoming: '未出發', completed: '旅程已完成',
}

// Compare validated ISO calendar dates in each trip's timezone, without UTC-day shifts.
export function calendarDate(now: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now)
  const part = (type: string) => parts.find((part) => part.type === type)!.value
  return `${part('year')}-${part('month')}-${part('day')}`
}
export function tripStatus(trip: Pick<DatedTrip, 'startDate' | 'endDate'>, today: string): TripStatus {
  return today < trip.startDate ? 'upcoming' : today > trip.endDate ? 'completed' : 'current'
}
export function operationalTripStatus(snapshot: TripSnapshot, now: Date): TripStatus {
  return activeExactDay(snapshot, now) ? 'current' : tripStatus(snapshot.trip, calendarDate(now, snapshot.trip.timezone))
}
export function orderTrips<T extends DatedTrip & { snapshot?: TripSnapshot }>(trips: readonly T[], now: Date = new Date()): { trip: T; status: TripStatus }[] {
  const rank: Record<TripStatus, number> = { current: 0, upcoming: 1, completed: 2 }
  const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0
  return trips.map((trip) => ({ trip, status: trip.snapshot ? operationalTripStatus(trip.snapshot, now) : tripStatus(trip, calendarDate(now, trip.timezone)) }))
    .sort((a, b) => rank[a.status] - rank[b.status] ||
      (a.status === 'completed' ? compare(b.trip.endDate, a.trip.endDate) : compare(a.trip.startDate, b.trip.startDate)) ||
      compare(a.trip.slug, b.trip.slug))
}
export function formatTripDate(date: string): string {
  const [year, month, day] = date.split('-')
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay()
  return `${day}/${month}/${year} 星期${['日', '一', '二', '三', '四', '五', '六'][weekday]}`
}
