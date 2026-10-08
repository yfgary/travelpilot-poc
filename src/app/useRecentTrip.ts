import { useState } from 'react'

export const RECENT_TRIP_KEY = 'travelpilot.recent-trip'
export function useRecentTrip() {
  const [recentSlug, setRecentSlug] = useState<string | null>(() => {
    try { return localStorage.getItem(RECENT_TRIP_KEY) } catch { return null }
  })
  function rememberTrip(slug: string) {
    setRecentSlug(slug)
    try { localStorage.setItem(RECENT_TRIP_KEY, slug) } catch { /* Optional local preference. */ }
  }
  return { recentSlug, rememberTrip }
}
