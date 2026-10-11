import type { WeatherMetrics } from '../../data/schema/weather'
export const metricLabels: [keyof WeatherMetrics, string, string][] = [
  ['visibilityKm', '👁 能見度', 'km'], ['cloudPct', '☁ 雲量', '%'], ['humidityPct', '💧 濕度', '%'], ['windKmh', '🌬 風速', 'km/h'], ['gustKmh', '💨 陣風', 'km/h'], ['precipitationMm', '🌧 降水', 'mm'], ['precipitationProbabilityPct', '☂ 降水機率', '%'], ['snowfallCm', '❄ 新降雪', 'cm'], ['snowDepthCm', '🏔 地面積雪', 'cm'],
]
export const display = (value: number | undefined, unit = '') => value === undefined ? '—' : `${Number.isInteger(value) ? value : value.toFixed(1)}${unit ? ` ${unit}` : ''}`
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
