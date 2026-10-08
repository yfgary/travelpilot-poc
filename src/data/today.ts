import type { TripSnapshot } from './schema/trip'
import type { Accommodation, NavigationTarget, TimelineItem, TripDay } from './itinerary'
import { dayHardCuts, resolveMaps } from './itinerary'
import { calendarDate } from './tripDates'
import { hardCutInstant } from './tripInformation'
import { timeMinutes, tripTime } from './tripTime'

export type TodayStop = { item: TimelineItem; name: string; maps: string; target?: NavigationTarget }
export type TodayPosition = { previous: TimelineItem | null; current: TimelineItem | null; next: TimelineItem | null; index: number }
export function selectTodayDay(snapshot: TripSnapshot, now: Date, remembered?: string | null): TripDay | undefined {
  const today = calendarDate(now, snapshot.trip.timezone)
  return snapshot.days.find((day) => day.date === today) ?? snapshot.days.find((day) => day.id === remembered) ?? [...snapshot.days].sort((a, b) => a.dayNumber - b.dayNumber)[0]
}
export function automaticPosition(items: readonly TimelineItem[], minute: number): TodayPosition {
  const timed = items.flatMap((item, index) => item.startTime ? [{ item, index, start: timeMinutes(item.startTime) }] : [])
  let current: typeof timed[number] | undefined, previous: typeof timed[number] | undefined
  for (const entry of timed) {
    const explicitEnd = entry.item.endTime ? timeMinutes(entry.item.endTime) : undefined
    const crossing = explicitEnd !== undefined && explicitEnd < entry.start
    const end = explicitEnd === undefined ? timed.find((later) => later.index > entry.index && later.start > entry.start)?.start ?? Infinity : explicitEnd + (crossing ? 1440 : 0)
    const clock = crossing && minute < explicitEnd! ? minute + 1440 : minute
    if (clock >= entry.start && clock < end) current = entry
    if (minute >= end) previous = entry
  }
  if (current) {
    const before = timed.filter((entry) => entry.index < current!.index).at(-1)
    return { previous: before?.item ?? null, current: current.item, next: items[current.index + 1] ?? null, index: current.index }
  }
  const next = timed.find((entry) => entry.start > minute && (!previous || entry.index > previous.index))
  return { previous: previous?.item ?? null, current: null, next: previous ? items[previous.index + 1] ?? null : next?.item ?? null, index: previous?.index ?? -1 }
}
export function resolveTodayStop(snapshot: TripSnapshot, item: TimelineItem): TodayStop | undefined {
  const target = snapshot.navigationTargets.find((target) => target.id === item.navigationTargetId)
  const place = snapshot.places.find((place) => place.id === item.placeId)
  const stay = snapshot.accommodations.find((stay) => stay.id === item.accommodationId)
  const transport = snapshot.transport.find((transport) => transport.id === item.transportId)
  const candidates = [
    ...(target ? [{ entity: target, name: target.title, target }] : []),
    ...(place ? [{ entity: place, name: place.name }] : []),
    ...(stay ? [{ entity: stay, name: stay.name }] : []),
    ...(transport ? [{ entity: transport, name: transport.service ?? transport.provider ?? `${transport.origin} → ${transport.destination}` },
      ...transport.navigationTargetIds.flatMap((id) => { const target = snapshot.navigationTargets.find((target) => target.id === id); return target ? [{ entity: target, name: target.title, target }] : [] })] : []),
  ]
  for (const candidate of candidates) {
    const maps = resolveMaps(candidate.entity)
    if (maps) return { item, name: candidate.name, maps, target: 'target' in candidate ? candidate.target : undefined }
  }
  return undefined
}
export function resolveTodayNavigation(snapshot: TripSnapshot, item: TimelineItem): NavigationTarget | undefined {
  const explicit = snapshot.navigationTargets.find((target) => target.id === item.navigationTargetId)
  if (explicit) return explicit
  const transport = snapshot.transport.find((transport) => transport.id === item.transportId)
  return transport?.navigationTargetIds.flatMap((id) => { const target = snapshot.navigationTargets.find((target) => target.id === id); return target ? [target] : [] })[0]
}
export function deriveToday(snapshot: TripSnapshot, day: TripDay, now: Date, manualId?: string | null) {
  const actualToday = day.date === calendarDate(now, snapshot.trip.timezone)
  const manualIndex = day.timeline.findIndex((item) => item.id === manualId)
  const manual = manualIndex >= 0
  const position: TodayPosition = manual || !actualToday ? (() => {
    const index = manual ? manualIndex : 0
    return { index: day.timeline.length ? index : -1, previous: day.timeline[index - 1] ?? null, current: day.timeline[index] ?? null, next: day.timeline[index + 1] ?? null }
  })() : automaticPosition(day.timeline, timeMinutes(tripTime(now, snapshot.trip.timezone)))
  const activities = day.timeline.map((item) => ({ item, stop: resolveTodayStop(snapshot, item), navigation: resolveTodayNavigation(snapshot, item) }))
  // Schedule focus and the next required mapped destination are separate concepts.
  const forward = activities.slice(Math.max(0, position.current ? position.index : position.index + 1))
  const candidates = forward.flatMap((entry) => entry.stop ? [entry.stop] : [])
  const nextStop = candidates.find((stop) => !stop.item.optional && !stop.item.bonus) ?? candidates[0]
  const navigation = forward.find((entry) => entry.navigation && !entry.item.optional && !entry.item.bonus)?.navigation ?? forward.find((entry) => entry.navigation)?.navigation
  const hardCuts = dayHardCuts(snapshot, day).map((cut) => ({ cut, instant: hardCutInstant(cut, snapshot, day) }))
    .sort((a, b) => (a.instant ?? Infinity) - (b.instant ?? Infinity) || b.cut.priority - a.cut.priority || ['critical', 'warning', 'info'].indexOf(a.cut.severity) - ['critical', 'warning', 'info'].indexOf(b.cut.severity) || a.cut.id.localeCompare(b.cut.id))
  const stayId = day.accommodationId ?? [...day.timeline].reverse().find((item) => item.accommodationId)?.accommodationId
  const accommodation: Accommodation | undefined = snapshot.accommodations.find((stay) => stay.id === stayId)
  const finalStop = [...activities].reverse().find((entry) => entry.stop)?.stop
  const driving = [...day.timeline.flatMap((item) => item.transportId ? [item.transportId] : []), ...[...day.optionalContent, ...day.backupContent].filter((ref) => ref.type === 'transport').map((ref) => ref.id)]
    .some((id) => snapshot.transport.some((transport) => transport.id === id && transport.type === 'car'))
  return { day, actualToday, manual, position, activities, nextStop, navigation, hardCuts, accommodation, finalStop, driving }
}
