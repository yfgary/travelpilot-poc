import { hasWeatherConfiguration } from '../../data/schema/trip'
import { useEffect, useRef } from 'react'
import { useTripWeather } from '../../app/TripWeather'
import { activeAlerts } from '../../services/weather/alerts'
import { scoreSuitability } from '../../data/weather/suitability'
import type { WeatherMetrics } from '../../data/schema/weather'
import { formatTripDate } from '../../data/tripDates'
import { ScoreSummary } from './ScoreSummary'
import '../../styles/weather.css'
const metricLabels: [keyof WeatherMetrics, string, string][] = [
  ['visibilityKm', '👁 能見度', 'km'], ['cloudPct', '☁ 雲量', '%'], ['humidityPct', '💧 濕度', '%'], ['windKmh', '🌬 風速', 'km/h'], ['gustKmh', '💨 陣風', 'km/h'], ['precipitationMm', '🌧 降水', 'mm'], ['precipitationProbabilityPct', '☂ 降水機率', '%'], ['snowfallCm', '❄ 新降雪', 'cm'], ['snowDepthCm', '🏔 地面積雪', 'cm'],
]
const display = (value: number | undefined, unit = '') => value === undefined ? '—' : `${Number.isInteger(value) ? value : value.toFixed(1)}${unit ? ` ${unit}` : ''}`
export function weatherCondition(code?: number): { icon: string; label: string } {
  if (code === undefined) return { icon: '◌', label: '天氣狀況未有資料' }
  if (code === 0) return { icon: '☀', label: '晴朗' }
  if (code <= 3) return { icon: '🌤', label: '多雲' }
  if ([45, 48].includes(code)) return { icon: '🌫', label: '有霧' }
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { icon: '❄', label: '降雪' }
  if ([95, 96, 99].includes(code)) return { icon: '⛈', label: '雷暴' }
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { icon: '🌧', label: '降雨' }
  return { icon: '◌', label: '其他天氣狀況' }
}
const severityLabels = { info: '資訊', minor: '輕微', moderate: '中等', severe: '嚴重', extreme: '極端' }
const typeLabels = { wind: '強風', heavy_rain: '大雨', snow: '降雪', flood: '水浸', thunderstorm: '雷暴', earthquake: '地震', tsunami: '海嘯', volcano: '火山', heat: '高溫', cold: '低溫', other: '其他' }
export function WeatherPanel() {
  const { snapshot, selected, select, results, load, alerts, alertsUnavailable } = useTripWeather()
  const scroller = useRef<HTMLDivElement>(null)
  useEffect(() => { if (selected) load(selected) }, [selected, load])
  if (!hasWeatherConfiguration(snapshot)) return <section className="panel weather-panel" data-testid="weather-panel"><h2>天氣與活動適宜度</h2><p className="weather-note">此旅程資料格式未提供天氣供應商及評分設定。</p></section>
  const config = snapshot.weather, region = config.weatherRegions.find((region) => region.id === selected), result = results[selected]
  const active = activeAlerts(alerts, selected)
  const forecast = result?.state === 'ready' ? result.forecast : null
  const time = (value: string) => new Intl.DateTimeFormat('zh-HK', { timeZone: forecast?.timezone ?? snapshot.trip.timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(value))
  const current = forecast?.current.metrics, condition = weatherCondition(current?.weatherCode)
  return <section className="panel weather-panel" data-testid="weather-panel" data-weather-region={selected}>
    <div className="weather-heading"><div><p className="eyebrow">WEATHER & SUITABILITY</p><h2>天氣與活動適宜度</h2></div><button className="weather-refresh" onClick={() => load(selected, true)} disabled={!selected || result?.state === 'loading'}>刷新</button></div>
    {!config.weatherRegions.length ? <p className="weather-note">尚未設定天氣地區。</p> : <div className="weather-region-selector" role="group" aria-label="天氣地區">{config.weatherRegions.map((region) => <button key={region.id} aria-pressed={selected === region.id} onClick={() => select(region.id)}>{region.label}</button>)}</div>}
    {active.length > 0 && <section className="weather-alerts" aria-label="官方警告"><h3>官方警告</h3>{active.map((alert) => <article className="weather-alert" key={`${alert.providerId}:${alert.id}`}>
      <p className="weather-alert-tags">{typeLabels[alert.type]} · {severityLabels[alert.severity]}{alert.isTest && <> · <strong>POC測試警告</strong></>}</p>
      {alert.isTest && <p className="weather-test-warning">非真實官方警告</p>}<h4>{alert.title}</h4>
      <p>影響地區：{alert.weatherRegionIds.map((id) => config.weatherRegions.find((region) => region.id === id)?.label ?? id).join('、')}</p>
      <p className="weather-note">發出：{time(alert.issuedAt)}{alert.effectiveAt && <> · 生效：{time(alert.effectiveAt)}</>}{alert.expiresAt && <> · 到期：{time(alert.expiresAt)}</>}</p>
      {alert.description && <p>{alert.description}</p>}{alert.instruction && <p>{alert.instruction}</p>}
      <p className="weather-note">來源：{alert.providerLabel ?? alert.providerId}{alert.officialUrl && <> · <a href={alert.officialUrl} target="_blank" rel="noopener noreferrer">{alert.isTest ? '測試警告來源' : '官方警告來源'}</a></>}</p>
    </article>)}</section>}
    {alertsUnavailable && <p className="weather-note">暫時未能取得警告資料；請自行查閱官方公告。</p>}
    <p className="weather-state" aria-live="polite">{!result || result.state === 'loading' ? (selected ? '載入天氣資料…' : '') : result.state === 'unconfigured' ? '此地區尚未有可用天氣供應商設定。' : result.state === 'unavailable' ? (navigator.onLine ? '暫時未能取得天氣資料' : '離線，尚未有已儲存天氣資料') : result.stale ? (navigator.onLine ? '正在使用較早前快取資料' : '離線，顯示已儲存天氣資料') : result.source === 'cache' ? '顯示已儲存天氣資料' : '天氣資料已更新'}</p>
    {forecast && current && region && <>
      <div className="weather-current"><div><p className="weather-condition"><span aria-hidden="true">{condition.icon}</span> {condition.label}</p><p className="weather-temperature">{display(current.temperatureC, '°C')}</p><p>體感 {display(current.apparentC, '°C')}</p></div><div className="weather-update"><p>觀測／模型時間：{time(forecast.current.observedAt)}</p><p>更新時間：{time(forecast.fetchedAt)}</p><p>時區：{forecast.timezone}</p></div></div>
      <dl className="weather-metrics">{metricLabels.map(([key, label, unit]) => <div key={key}><dt>{label}</dt><dd>{display(current[key], unit)}</dd></div>)}</dl>
      <ScoreSummary score={scoreSuitability(config, current, { regionId: region.regionId })} />
      <h3>未來5日預測</h3><p className="weather-note">{forecast.daily[0].date <= snapshot.trip.startDate && snapshot.trip.endDate <= forecast.daily[4].date ? '預測會隨時間更新；請在出行前再次確認。' : '5日預測由目前日期起計，未代表實際行程日天氣。接近出發日期時先具有行程決策價值。'}</p>
      <div ref={scroller} className="weather-forecast" tabIndex={0} role="region" aria-label="未來5日預測，可橫向捲動" onKeyDown={(event) => { if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); scroller.current?.scrollBy({ left: event.key === 'ArrowRight' ? 240 : -240, behavior: 'auto' }) } }}>
        {forecast.daily.map((day, i) => { const condition = weatherCondition(day.metrics.weatherCode); return <article className="weather-forecast-day" key={day.date}>
          <p className="weather-forecast-date"><time dateTime={day.date}>{formatTripDate(day.date)}</time>{i >= 3 && <span className="weather-trend">趨勢參考</span>}</p>
          <p>{condition.icon} {condition.label}</p><p className="weather-forecast-temp">{display(day.temperatureMinC)} – {display(day.temperatureMaxC, '°C')}</p><p>體感 {display(day.metrics.apparentMinC)} – {display(day.metrics.apparentMaxC, '°C')}</p>
          <dl className="weather-daily-metrics">{metricLabels.map(([key, label, unit]) => <div key={key}><dt>{key === 'snowDepthCm' ? '🏔 正午積雪' : key === 'visibilityKm' ? '👁 平均能見度' : label}</dt><dd>{display(day.metrics[key], unit)}</dd></div>)}<div><dt>最低能見度</dt><dd>{display(day.visibilityMinKm, 'km')}</dd></div></dl>
          <ScoreSummary score={scoreSuitability(config, day.metrics, { regionId: region.regionId })} compact />
        </article> })}
      </div><p className="weather-note">第4–5日僅供趨勢參考。天氣分數為活動建議，不能代替官方停運、封路或安全公告。</p>
      <p className="weather-attribution">天氣來源：<a href={forecast.attribution.url} target="_blank" rel="noopener noreferrer">{forecast.attribution.label}</a> · 座標樣本預測</p>
      {result?.state === 'ready' && !result.cacheSaved && <p className="weather-note">此裝置暫時未能儲存離線天氣資料。</p>}
      {[...region.operationNotes, ...config.operationNotes].map((note) => <p className="weather-note" key={note}>{note}</p>)}
    </>}
  </section>
}
