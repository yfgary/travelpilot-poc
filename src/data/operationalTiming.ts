import type { TripSnapshot } from './schema/trip'
import type { TimelineItem, TripDay } from './itinerary'

export function timelineTiming(item: TimelineItem) {
  return 'timing' in item ? item.timing : undefined
}
// Exact intervals are half-open; calendar clocks never extend an operational day.
export function activeExactStart(item: TimelineItem, now: Date): number | undefined {
  const timing = timelineTiming(item)
  if (!timing) return undefined
  const start = Date.parse(timing.start.dateTime), end = Date.parse(timing.end.dateTime), instant = now.getTime()
  return Number.isFinite(start) && Number.isFinite(end) && start < end && start <= instant && instant < end ? start : undefined
}
export function dayHasActiveExactTiming(snapshot: TripSnapshot, day: TripDay, now: Date): boolean {
  return snapshot.schemaVersion === 5 && day.timeline.some((item) => activeExactStart(item, now) !== undefined)
}
export function activeExactDay(snapshot: TripSnapshot, now: Date): TripDay | undefined {
  if (snapshot.schemaVersion !== 5) return undefined
  // Latest absolute start wins; canonical day number resolves cross-day ties.
  return snapshot.days.flatMap((day) => day.timeline.flatMap((item) => {
    const start = activeExactStart(item, now)
    return start === undefined ? [] : [{ day, start }]
  })).sort((a, b) => b.start - a.start || a.day.dayNumber - b.day.dayNumber)[0]?.day
}
