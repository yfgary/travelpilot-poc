import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { localTrips } from '../data/trips'
import { listTrips, type TripListResult } from '../services/trips'

export function useHomeTrips() {
  const { phase, session } = useAuth()
  const ownerId = session?.user.id ?? null
  const initializing = phase === 'initializing'
  const [online, setOnline] = useState(navigator.onLine)
  const [loaded, setLoaded] = useState<{ ownerId: string | null; result: TripListResult } | null>(null)
  useEffect(() => {
    const changed = () => setOnline(navigator.onLine)
    window.addEventListener('online', changed); window.addEventListener('offline', changed)
    return () => { window.removeEventListener('online', changed); window.removeEventListener('offline', changed) }
  }, [])
  useEffect(() => {
    if (initializing) return
    let active = true
    const controller = new AbortController(), timeout = window.setTimeout(() => controller.abort(), 15000)
    setLoaded(null)
    void listTrips({ userId: ownerId, online, signal: controller.signal }).then((result) => {
      if (active) setLoaded({ ownerId, result })
    }).finally(() => window.clearTimeout(timeout))
    return () => { active = false; controller.abort(); window.clearTimeout(timeout) }
  }, [ownerId, initializing, online])
  // Hide previous-account results synchronously, before the effect runs.
  const result = !initializing && loaded?.ownerId === ownerId ? loaded.result : null
  const trips = result?.trips.map((record) => ({ ...record.snapshot.trip, snapshot: record.snapshot, demo: record.source === 'demo' }))
    ?? localTrips.map(({ payload }) => ({ ...payload.trip, snapshot: payload, demo: true }))
  return { trips, loading: !result, unavailable: result?.unavailable, rejected: result?.rejected, storageUnavailable: result?.storageUnavailable }
}
