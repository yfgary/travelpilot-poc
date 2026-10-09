import { calendarDate, formatTripDate } from './tripDates'
import type { TimelineItem } from './itinerary'

export function tripTime(now: Date, timezone: string, seconds = false): string {
  return new Intl.DateTimeFormat('en-GB', { timeZone: timezone, hour: '2-digit', minute: '2-digit', ...(seconds ? { second: '2-digit' as const } : {}), hourCycle: 'h23' }).format(now)
}
export function timeMinutes(time: string): number {
  const [hour, minute] = time.split(':').map(Number)
  return hour * 60 + minute
}
// Resolve a validated calendar date/time in an IANA zone (including offset changes).
export function calendarInstant(date: string, time: string, timezone: string): number {
  const wall = Date.parse(`${date}T${time}:00Z`)
  let instant = wall
  for (let i = 0; i < 3; i++) {
    const value = new Date(instant)
    const adjustment = wall - Date.parse(`${calendarDate(value, timezone)}T${tripTime(value, timezone)}:00Z`)
    if (!adjustment) break
    instant += adjustment
  }
  return instant
}
export function plannedDelta(instant: number, now: number): string {
  const minutes = Math.round((instant - now) / 60000)
  return minutes > 0 ? `距原定時間 ${minutes}分鐘` : minutes < 0 ? `原定時間已過 ${Math.abs(minutes)}分鐘` : '正值原定時間'
}

export function timelineTiming(item: TimelineItem) {
  return 'timing' in item ? item.timing : undefined
}
export function timelineStartInstant(item: TimelineItem, date: string, timezone: string): number | undefined {
  const timing = timelineTiming(item)
  return timing ? Date.parse(timing.start.dateTime) : item.startTime ? calendarInstant(date, item.startTime, timezone) : undefined
}
export function timelineEndInstant(item: TimelineItem, date: string, timezone: string): number | undefined {
  const timing = timelineTiming(item)
  if (timing) return Date.parse(timing.end.dateTime)
  if (!item.endTime) return undefined
  const overnight = item.startTime && timeMinutes(item.endTime) < timeMinutes(item.startTime)
  const endDate = overnight ? new Date(Date.parse(`${date}T00:00:00Z`) + 86400000).toISOString().slice(0, 10) : date
  return calendarInstant(endDate, item.endTime, timezone)
}
export function timelineTimeLabel(item: TimelineItem, endpoint: 'start' | 'end'): string | undefined {
  const timing = timelineTiming(item)
  if (!timing) return endpoint === 'start' ? item.startTime ?? '未定時間' : item.endTime
  const value = timing[endpoint], instant = new Date(value.dateTime)
  return `${formatTripDate(calendarDate(instant, value.timeZone))} ${tripTime(instant, value.timeZone)} · ${value.timeZone}`
}
