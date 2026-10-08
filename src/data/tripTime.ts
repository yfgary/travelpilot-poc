import { calendarDate } from './tripDates'

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
