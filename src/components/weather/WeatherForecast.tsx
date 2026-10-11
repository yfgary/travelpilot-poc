import { useRef } from 'react'
import type { WeatherConfiguration, WeatherForecast as Forecast } from '../../data/schema/weather'
import { scoreSuitability } from '../../data/weather/suitability'
import { formatTripDate } from '../../data/tripDates'
import { POC_WEATHER_PREVIEW, simulatedWeatherNotice } from '../../data/weather/qaPreview'
import { ScoreSummary } from './ScoreSummary'
import { display, metricLabels, weatherCondition } from './weatherDisplay'

// Both weather views present the same validated, region-scoped five-day forecast.
export function WeatherForecast({ forecast, config, regionId, startDate, endDate }: {
  forecast: Forecast; config: WeatherConfiguration; regionId: string; startDate: string; endDate: string
}) {
  const scroller = useRef<HTMLDivElement>(null)
  return <>
      <h3>未來5日預測</h3>{POC_WEATHER_PREVIEW && !(forecast.daily[0].date <= startDate && endDate <= forecast.daily[4].date) ? <p className="weather-simulation" data-testid="weather-panel-simulation">{simulatedWeatherNotice}</p> : <p className="weather-note">{forecast.daily[0].date <= startDate && endDate <= forecast.daily[4].date ? '預測會隨時間更新；請在出行前再次確認。' : '5日預測由目前日期起計，未代表實際行程日天氣。接近出發日期時先具有行程決策價值。'}</p>}
      <div ref={scroller} className="weather-forecast" tabIndex={0} role="region" aria-label="未來5日預測，可橫向捲動" onKeyDown={(event) => { if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); scroller.current?.scrollBy({ left: event.key === 'ArrowRight' ? 240 : -240, behavior: 'auto' }) } }}>
        {forecast.daily.map((day, i) => { const condition = weatherCondition(day.metrics.weatherCode); return <article className="weather-forecast-day" key={day.date}>
          <header className="weather-forecast-overview"><p className="weather-forecast-date"><time dateTime={day.date}>{formatTripDate(day.date)}</time>{i >= 3 && <span className="weather-trend">趨勢參考</span>}</p>
          <p>{condition.icon} {condition.label}</p><p className="weather-forecast-temp">{display(day.temperatureMinC)} – {display(day.temperatureMaxC, '°C')}</p><p>體感 {display(day.metrics.apparentMinC)} – {display(day.metrics.apparentMaxC, '°C')}</p></header>
          <dl className="weather-daily-metrics">{metricLabels.map(([key, label, unit]) => <div key={key}><dt>{key === 'snowDepthCm' ? '🏔 正午積雪' : key === 'visibilityKm' ? '👁 平均能見度' : label}</dt><dd>{display(day.metrics[key], unit)}</dd></div>)}<div><dt>最低能見度</dt><dd>{display(day.visibilityMinKm, 'km')}</dd></div></dl>
          <div className="weather-forecast-score"><ScoreSummary score={scoreSuitability(config, day.metrics, { regionId })} compact /></div>
        </article> })}
      </div><p className="weather-note">第4–5日僅供趨勢參考。天氣分數為活動建議，不能代替官方停運、封路或安全公告。</p>
  </>
}
