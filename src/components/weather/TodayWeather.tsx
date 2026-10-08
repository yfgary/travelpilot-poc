import { useEffect, useMemo } from 'react'
import { useTripWeather } from '../../app/TripWeather'
import { hasWeatherConfiguration } from '../../data/schema/trip'
import { scoreSuitability } from '../../data/weather/suitability'
import { calendarDate, formatTripDate } from '../../data/tripDates'
import { tripTime } from '../../data/tripTime'
import type { TripDay } from '../../data/itinerary'
import { activeAlerts } from '../../services/weather/alerts'
import { ExternalLink } from '../itinerary/ContentActions'
import { ScoreSummary } from './ScoreSummary'
import { weatherCondition, severityLabels, typeLabels } from './WeatherPanel'
import '../../styles/weather.css'

const display = (value: number | undefined, unit: string) => value === undefined ? '—' : `${Math.round(value * 10) / 10} ${unit}`
export function TodayWeather({ day, actualToday, now }: { day: TripDay; actualToday: boolean; now: number }) {
  const { snapshot, results, load, alerts, alertsUnavailable } = useTripWeather()
  const configured = hasWeatherConfiguration(snapshot)
  const mapping = configured ? snapshot.weather.dayRegions.find((mapping) => mapping.dayId === day.id) : undefined
  const regionId = mapping?.weatherRegionId ?? ''
  useEffect(() => {
    if (!regionId) return
    load(regionId)
    const connectionChanged = () => load(regionId, true)
    window.addEventListener('online', connectionChanged); window.addEventListener('offline', connectionChanged)
    return () => { window.removeEventListener('online', connectionChanged); window.removeEventListener('offline', connectionChanged) }
  }, [regionId, load])
  const region = snapshot.weather.weatherRegions.find((region) => region.id === regionId)
  const result = results[regionId], forecast = result?.state === 'ready' ? result.forecast : undefined
  const daily = forecast?.daily.find((forecastDay) => forecastDay.date === day.date)
  const metrics = actualToday ? forecast?.current.metrics : daily?.metrics
  const score = useMemo(() => configured && metrics ? scoreSuitability(snapshot.weather, metrics, { dayId: day.id }) : undefined, [configured, snapshot.weather, metrics, day.id])
  const active = useMemo(() => activeAlerts(alerts, regionId, now), [alerts, regionId, now])
  const time = (value: string) => { const date = new Date(value), timezone = forecast?.timezone ?? snapshot.trip.timezone; return `${formatTripDate(calendarDate(date, timezone))} ${tripTime(date, timezone)}` }
  const condition = weatherCondition(metrics?.weatherCode)
  return <section className="today-card today-weather" data-testid="today-weather" data-weather-region={regionId}>
    <div className="today-section-heading"><h2>{actualToday ? '當地即時天氣' : '行程日天氣'}</h2>{region && <span>{region.label}</span>}</div>
    {!configured ? <p>此旅程資料格式未提供天氣供應商及評分設定。</p> : !mapping ? <p>所選行程日尚未設定天氣地區。</p> : <>
      {active.length > 0 && <section className="today-alerts" aria-label="官方警告"><h3>官方警告</h3>{active.map((alert) => <article className="weather-alert" key={`${alert.providerId}:${alert.id}`}>
        <p>{typeLabels[alert.type]} · {severityLabels[alert.severity]}{alert.isTest && <> · <strong>POC測試警告</strong></>}</p>
        {alert.isTest && <p className="weather-test-warning">非真實官方警告</p>}<h4>{alert.title}</h4>
        {alert.description && <p>{alert.description}</p>}{alert.instruction && <p>{alert.instruction}</p>}
        <p className="weather-note">來源：{alert.providerLabel ?? alert.providerId} · 發出：{time(alert.issuedAt)}{alert.expiresAt && <> · 到期：{time(alert.expiresAt)}</>}</p>
        <ExternalLink href={alert.officialUrl}>{alert.isTest ? '測試警告來源' : '官方警告來源'}</ExternalLink>
      </article>)}</section>}
      {alertsUnavailable && <p className="weather-note">暫時未能取得警告資料；請自行查閱官方公告。</p>}
      <p className="weather-state" aria-live="polite">{!result || result.state === 'loading' ? '載入天氣資料…' : result.state === 'unconfigured' ? '此地區尚未有可用天氣供應商設定。' : result.state === 'unavailable' ? (navigator.onLine ? '暫時未能取得天氣資料' : '離線，尚未有已儲存天氣資料') : result.stale ? (navigator.onLine ? '正在使用較早前快取資料' : '離線，顯示已儲存天氣資料') : result.source === 'cache' ? '顯示已儲存天氣資料' : '天氣資料已更新'}</p>
      {forecast && !actualToday && !daily && <p data-testid="today-weather-outside">目前5日預測未涵蓋所選行程日。</p>}
      {forecast && metrics && <>
        <p className="today-weather-period">{actualToday ? '目前觀測／模型資料' : `該日預測 · ${formatTripDate(day.date)}`}</p>
        <p className="today-weather-main">{condition.icon} {condition.label} · {actualToday ? display(metrics.temperatureC, '°C') : `${display(daily?.temperatureMinC, '°C')} – ${display(daily?.temperatureMaxC, '°C')}`}</p>
        <dl className="today-weather-metrics">
          <div><dt>體感</dt><dd>{display(metrics.apparentC, '°C')}</dd></div><div><dt>能見度</dt><dd>{display(metrics.visibilityKm, 'km')}</dd></div>
          <div><dt>陣風</dt><dd>{display(metrics.gustKmh, 'km/h')}</dd></div><div><dt>降水</dt><dd>{display(metrics.precipitationMm, 'mm')}</dd></div>
          <div><dt>新降雪</dt><dd>{display(metrics.snowfallCm, 'cm')}</dd></div><div><dt>{actualToday ? '地面積雪' : '正午積雪'}</dt><dd>{display(metrics.snowDepthCm, 'cm')}</dd></div>
        </dl>
        {score && <ScoreSummary score={score} compact />}
        {actualToday && <p className="weather-note">觀測／模型時間：{time(forecast.current.observedAt)}</p>}
      </>}
      {forecast && <><p className="weather-note">更新時間：{time(forecast.fetchedAt)} · {forecast.timezone}</p><p className="weather-note">天氣來源：<ExternalLink href={forecast.attribution.url}>{forecast.attribution.label}</ExternalLink></p></>}
      {result?.state === 'ready' && !result.cacheSaved && <p className="weather-note">此裝置暫時未能儲存離線天氣資料。</p>}
      {[...new Set([...(region?.operationNotes ?? []), ...snapshot.weather.operationNotes])].map((note) => <p className="weather-note" key={note}>{note}</p>)}
      <p className="weather-note">天氣適宜度不代表道路或服務正在運作；官方警告及運行狀態需分開確認。</p>
    </>}
  </section>
}
