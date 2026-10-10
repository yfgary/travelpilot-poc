import { useState } from 'react'
import type { TripSnapshot } from '../data/schema/trip'
import { selectTodayDay } from '../data/today'
import { timelineTiming } from '../data/operationalTiming'

export const todayPreviewKey = (tripId: string) => `travelpilot.today.preview.${encodeURIComponent(tripId)}`
export const todayProgressKey = (tripId: string, dayId: string) => `travelpilot.today.progress.${JSON.stringify([tripId, dayId])}`
function read(key: string) { try { return sessionStorage.getItem(key) } catch { return null } }
function write(key: string, value: string | null) { try { if (value === null) sessionStorage.removeItem(key); else sessionStorage.setItem(key, value) } catch { /* React state remains usable when session storage is blocked. */ } }
// TripLayout's keyed boundary provides trip/version isolation; item IDs survive reordering.
export function useTodaySession(snapshot: TripSnapshot, now: Date) {
  const [remembered] = useState(() => read(todayPreviewKey(snapshot.trip.id)))
  const [selection, setSelection] = useState(() => ({ id: selectTodayDay(snapshot, now, remembered)?.id, manual: false }))
  // Re-evaluate exact operational selection on the existing clock; explicit day previews stay put.
  const followsExactTiming = snapshot.schemaVersion >= 5 && snapshot.days.some((day) => day.timeline.some((item) => timelineTiming(item)))
  const dayId = followsExactTiming && !selection.manual ? selectTodayDay(snapshot, now, remembered)?.id : selection.id
  const [progress, setProgress] = useState<Record<string, string | null>>(() => Object.fromEntries(snapshot.days.map((day) => {
    const saved = read(todayProgressKey(snapshot.trip.id, day.id))
    return [day.id, day.timeline.some((item) => item.id === saved) ? saved : null]
  })))
  function selectDay(id: string) {
    if (!snapshot.days.some((day) => day.id === id)) return
    setSelection({ id, manual: true }); write(todayPreviewKey(snapshot.trip.id), id)
  }
  function focusItem(id: string, itemId: string | null) {
    const day = snapshot.days.find((day) => day.id === id)
    if (!day || (itemId !== null && !day.timeline.some((item) => item.id === itemId))) return
    setProgress((previous) => ({ ...previous, [id]: itemId })); write(todayProgressKey(snapshot.trip.id, id), itemId)
  }
  return { dayId, selectDay, progress, focusItem }
}
