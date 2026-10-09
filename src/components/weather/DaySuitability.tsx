import { hasWeatherConfiguration } from '../../data/schema/trip'
import { useEffect } from 'react'
import { useTripWeather } from '../../app/TripWeather'
import { scoreSuitability } from '../../data/weather/suitability'
import { ScoreSummary } from './ScoreSummary'
import { POC_WEATHER_PREVIEW, simulatedWeatherNotice } from '../../data/weather/qaPreview'
export function DaySuitability({ dayId, date }: { dayId: string; date: string }) {
  const { snapshot, results, load } = useTripWeather()
  const mapping = hasWeatherConfiguration(snapshot) ? snapshot.weather.dayRegions.find((mapping) => mapping.dayId === dayId) : undefined
  useEffect(() => { if (mapping) load(mapping.weatherRegionId) }, [mapping, load])
  if (!hasWeatherConfiguration(snapshot) || !mapping) return null
  const result = results[mapping.weatherRegionId]
  if (!result || result.state === 'loading') return <p className="weather-note">正在核對行程日期的天氣預測…</p>
  if (result.state !== 'ready') return <p className="weather-note">此行程日期暫未有可用天氣預測。</p>
  const forecastDay = result.forecast.daily.find((day) => day.date === date)
  const simulated = !forecastDay && POC_WEATHER_PREVIEW
  if (!forecastDay && !simulated) return <p className="weather-note" data-testid="day-weather-outside">行程日期未進入未來5日天氣預測範圍，接近出發時才有相應預報。</p>
  const metrics = forecastDay?.metrics ?? result.forecast.current.metrics
  return <section className="day-suitability" aria-label="行程日適宜度" data-testid="day-suitability">
    {simulated && <p className="weather-simulation" data-testid="day-weather-simulation">{simulatedWeatherNotice}</p>}
    <ScoreSummary score={scoreSuitability(snapshot.weather, metrics, { dayId })} compact />
    {result.stale && <p className="weather-note">此分數使用已儲存預測，請留意資料更新時間。</p>}
  </section>
}
