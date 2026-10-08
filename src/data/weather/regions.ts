import type { Schema3Snapshot } from '../schema/trip'
import { localDate } from '../../services/weather/providers/openMeteo'
export const regionPreferenceKey = (tripId: string) => `travelpilot.weather-region.${tripId}`
export function defaultWeatherRegion(snapshot: Schema3Snapshot, now = Date.now(), remembered?: string | null) {
  const ids = snapshot.weather.weatherRegions.map((region) => region.id)
  if (remembered && ids.includes(remembered)) return remembered
  const today = localDate(now / 1000, snapshot.trip.timezone)
  if (snapshot.trip.startDate <= today && today <= snapshot.trip.endDate) {
    const day = snapshot.days.find((day) => day.date === today)
    const mapping = snapshot.weather.dayRegions.find((mapping) => mapping.dayId === day?.id)
    if (mapping && ids.includes(mapping.weatherRegionId)) return mapping.weatherRegionId
  }
  return ids[0] ?? ''
}
