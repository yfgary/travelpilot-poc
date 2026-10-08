import { openDB, type DBSchema } from 'idb'
import { weatherForecastSchema, type WeatherForecast } from '../data/schema/weather'
interface WeatherDB extends DBSchema { forecasts: { key: [string, string, string]; value: { key: [string, string, string]; signature: string; payload: WeatherForecast } } }
export const WEATHER_CACHE_DATABASE = 'travelpilot-v2-weather-cache'
const db = () => openDB<WeatherDB>(WEATHER_CACHE_DATABASE, 1, { upgrade(database) { database.createObjectStore('forecasts', { keyPath: 'key' }) } })
export async function readWeatherCache(key: [string, string, string], signature: string): Promise<WeatherForecast | null> {
  try {
    const database = await db()
    try {
      const record = await database.get('forecasts', key), parsed = weatherForecastSchema.safeParse(record?.payload)
      if (!record || record.signature !== signature || !parsed.success || parsed.data.tripId !== key[0] || parsed.data.weatherRegionId !== key[1] || parsed.data.providerId !== key[2]) return null
      return parsed.data
    } finally { database.close() }
  } catch { return null }
}
export async function writeWeatherCache(payload: WeatherForecast, signature: string): Promise<boolean> {
  try {
    const parsed = weatherForecastSchema.parse(payload), database = await db()
    try { await database.put('forecasts', { key: [parsed.tripId, parsed.weatherRegionId, parsed.providerId], signature, payload: parsed }); return true } finally { database.close() }
  } catch { return false }
}
