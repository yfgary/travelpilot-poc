import type { WeatherForecast } from '../src/data/schema/weather'
export function openMeteoResponse(start = new Date().toISOString().slice(0, 10), temperature = 18) {
  const midnight = Date.parse(`${start}T00:00:00Z`) / 1000
  const hours = Array.from({ length: 120 }, (_, i) => midnight + i * 3600)
  const five = (value: number) => Array(5).fill(value)
  return {
    current: { time: midnight + 12 * 3600, temperature_2m: temperature, relative_humidity_2m: 65, apparent_temperature: temperature - 1, precipitation: 1, precipitation_probability: 20, snowfall: 2, snow_depth: .15, weather_code: 2, cloud_cover: 30, wind_speed_10m: 12, wind_gusts_10m: 24, visibility: 12000 },
    current_units: { temperature_2m: '°C', apparent_temperature: '°C', relative_humidity_2m: '%', precipitation: 'mm', precipitation_probability: '%', snowfall: 'cm', snow_depth: 'm', weather_code: 'wmo code', cloud_cover: '%', wind_speed_10m: 'km/h', wind_gusts_10m: 'km/h', visibility: 'm' },
    hourly: { time: hours, visibility: hours.map((_, i) => i % 24 < 12 ? 8000 : 16000), cloud_cover: hours.map((_, i) => i % 24 < 12 ? 20 : 60), relative_humidity_2m: hours.map((_, i) => i % 24 < 12 ? 50 : 70), snow_depth: hours.map((_, i) => i % 24 === 12 ? .2 : .1) },
    hourly_units: { visibility: 'm', cloud_cover: '%', relative_humidity_2m: '%', snow_depth: 'm' },
    daily: { time: Array.from({ length: 5 }, (_, i) => midnight + i * 86400), weather_code: five(2), temperature_2m_max: five(temperature + 3), temperature_2m_min: five(temperature - 5), apparent_temperature_max: five(temperature + 2), apparent_temperature_min: five(temperature - 6), precipitation_probability_max: five(30), precipitation_sum: five(2), snowfall_sum: five(3), wind_speed_10m_max: five(15), wind_gusts_10m_max: five(28) },
    daily_units: { weather_code: 'wmo code', temperature_2m_max: '°C', temperature_2m_min: '°C', apparent_temperature_max: '°C', apparent_temperature_min: '°C', precipitation_probability_max: '%', precipitation_sum: 'mm', snowfall_sum: 'cm', wind_speed_10m_max: 'km/h', wind_gusts_10m_max: 'km/h' },
  }
}
export async function weatherCacheContents(page: import('@playwright/test').Page) {
  return page.evaluate(async () => {
    const request = indexedDB.open('travelpilot-v2-weather-cache', 1)
    const database = await new Promise<IDBDatabase>((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error) })
    try {
      const read = database.transaction('forecasts').objectStore('forecasts').getAll()
      return await new Promise<{ key: string[]; signature: string; payload: WeatherForecast }[]>((resolve, reject) => { read.onsuccess = () => resolve(read.result); read.onerror = () => reject(read.error) })
    } finally { database.close() }
  })
}
