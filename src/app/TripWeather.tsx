import { hasWeatherConfiguration } from '../data/schema/trip'
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { TripSnapshot } from '../data/schema/trip'
import { defaultWeatherRegion, regionPreferenceKey } from '../data/weather/regions'
import { FORECAST_TTL_MS, loadForecast, type ForecastResult } from '../services/weather/forecasts'
import { loadAlerts } from '../services/weather/alerts'
import type { OfficialAlert } from '../data/schema/weather'
type WeatherContext = { snapshot: TripSnapshot; selected: string; select: (id: string) => void; results: Record<string, ForecastResult>; load: (id: string, force?: boolean) => void; alerts: OfficialAlert[]; alertsUnavailable: boolean }
const Context = createContext<WeatherContext | null>(null)
export function TripWeatherProvider({ snapshot, children }: { snapshot: TripSnapshot; children: ReactNode }) {
  const [selected, setSelected] = useState(() => {
    if (!hasWeatherConfiguration(snapshot)) return ''
    let remembered: string | null = null
    try { remembered = localStorage.getItem(regionPreferenceKey(snapshot.trip.id)) } catch { /* Local preferences are optional. */ }
    return defaultWeatherRegion(snapshot, Date.now(), remembered)
  })
  const [results, setResults] = useState<Record<string, ForecastResult>>({})
  const [alertState, setAlertState] = useState<{ alerts: OfficialAlert[]; unavailable: boolean }>({ alerts: [], unavailable: false })
  const alive = useRef(true), pending = useRef(new Set<string>()), resolved = useRef<Record<string, ForecastResult>>({})
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
  useEffect(() => {
    let active = true
    if (hasWeatherConfiguration(snapshot)) void loadAlerts(snapshot.weather).then((state) => { if (active) setAlertState(state) })
    return () => { active = false }
  }, [snapshot])
  const load = useCallback((id: string, force = false) => {
    if (!hasWeatherConfiguration(snapshot) || !id || pending.current.has(id)) return
    const previous = resolved.current[id]
    if (!force && previous && (previous.state !== 'ready' || (navigator.onLine && !previous.stale && Date.now() - Date.parse(previous.forecast.fetchedAt) < FORECAST_TTL_MS))) return
    pending.current.add(id); setResults((previous) => ({ ...previous, [id]: { state: 'loading' } }))
    void loadForecast(snapshot, id, { online: navigator.onLine, force }).then((result) => {
      if (alive.current) { resolved.current[id] = result; setResults((previous) => ({ ...previous, [id]: result })) }
    }).finally(() => pending.current.delete(id))
  }, [snapshot])
  useEffect(() => {
    const reconnect = () => load(selected, true)
    window.addEventListener('online', reconnect); window.addEventListener('offline', reconnect)
    return () => { window.removeEventListener('online', reconnect); window.removeEventListener('offline', reconnect) }
  }, [load, selected])
  const select = useCallback((id: string) => {
    if (!snapshot.weather.weatherRegions.some((region) => region.id === id)) return
    setSelected(id)
    try { localStorage.setItem(regionPreferenceKey(snapshot.trip.id), id) } catch { /* Keep the selection in memory. */ }
  }, [snapshot])
  return <Context.Provider value={{ snapshot, selected, select, results, load, alerts: alertState.alerts, alertsUnavailable: alertState.unavailable }}>{children}</Context.Provider>
}
export function useTripWeather() { const context = useContext(Context); if (!context) throw new Error('Trip weather requires the shared trip boundary'); return context }
