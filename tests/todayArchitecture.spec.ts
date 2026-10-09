import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { test, expect } from './fixtures'
import { CURRENT_TRIP_SCHEMA_VERSION, SUPPORTED_TRIP_SCHEMA_VERSIONS } from '../src/data/schema/trip'
import { localTrips } from '../src/data/trips'
import metadata from '../package.json' with { type: 'json' }
import { todayPreviewKey, todayProgressKey } from '../src/app/useTodaySession'

const files = ['src/data/operationalTiming.ts', 'src/data/today.ts', 'src/data/tripTime.ts', 'src/views/TodayMode.tsx', 'src/app/useTodaySession.ts', 'src/app/useTripClock.ts', 'src/components/today/ScreenAwake.tsx', 'src/components/weather/TodayWeather.tsx']
test('session identities remain isolated even when valid stable IDs contain punctuation', () => {
  expect(todayProgressKey('trip.part', 'day')).not.toBe(todayProgressKey('trip', 'part.day'))
  expect(todayProgressKey('trip:part', 'day')).not.toBe(todayProgressKey('trip', 'part:day'))
  expect(todayProgressKey('trip', 'day.one')).not.toBe(todayProgressKey('trip', 'day.two'))
  expect(todayPreviewKey('trip.one')).not.toBe(todayPreviewKey('trip.two'))
})
test('Today is generic derived state with one trip boundary, shared weather/scoring and no semantic inference', () => {
  for (const path of files) {
    const source = readFileSync(path, 'utf8')
    expect(source).not.toMatch(/loadTrip\s*\(|supabase|indexedDB|tripCache|\.from\s*\(|fetch\s*\(|open-meteo/i)
    expect(source).not.toMatch(/Japan|Nagoya|Shirakawa|Shinhotaka|Hakuba|Takayama|Bangkok|Hokkaido|demo-trip|demo-road-trip|\bD[126]\b|Asia\/Tokyo/i)
    expect(source).not.toMatch(/Japan2027Core|DOMParser|querySelector|hydrate|localStorage/)
    expect(source).not.toMatch(/(?:trip\.slug|country|dayNumber|placeId|item\.title)\s*===\s*['"\d]/)
    expect(source).not.toMatch(/\/(?:parking|hotel|住宿|旅館|hard\s*cut|deadline|最遲)[^\n]*\/[gi]/i)
  }
  expect(readFileSync('src/views/TodayMode.tsx', 'utf8')).toContain('useLoadedTrip()')
  const weather = readFileSync('src/components/weather/TodayWeather.tsx', 'utf8')
  expect(weather).toContain('useTripWeather()'); expect(weather).toContain('scoreSuitability('); expect(weather).toContain('activeAlerts('); expect(weather).toContain('weather.dayRegions')
  expect(weather).not.toContain('select('); expect(readFileSync('src/app/App.tsx', 'utf8')).not.toContain('TripView')
})
test('Step 15C keeps immutable Data Versions, trip engines, SQL, stores, auth, Back and production boundary unchanged', () => {
  expect(CURRENT_TRIP_SCHEMA_VERSION).toBe(6); expect(SUPPORTED_TRIP_SCHEMA_VERSIONS).toEqual([1, 2, 3, 4, 5, 6]); expect(metadata.version).toMatch(/^2\.0\.0-poc\.\d+$/)
  expect(localTrips.map((trip) => trip.dataVersion).sort()).toEqual(['demo.city.5', 'demo.road.5'])
  const paths = ['src/data/schema/trip.ts', 'src/data/demoTrips', 'src/data/trips.ts', 'src/offline', 'src/services/checklists.ts', 'src/services/checklistSync.ts', 'src/services/weather/providers', 'src/auth', 'src/app/NavigationHistory.tsx', 'src/app/TripWeather.tsx', 'src/views/TripLayout.tsx', 'src/views/Settings.tsx', 'src/views/DetailedItinerary.tsx', 'src/views/TripInformation.tsx', 'src/views/AttractionsOverview.tsx', 'src/views/LiveCam.tsx', 'src/data/weather', 'supabase', 'assets/images', 'assets/demo', '.github/workflows']
  expect(execFileSync('git', ['diff', 'HEAD', '--', ...paths], { encoding: 'utf8' })).toBe('')
  expect(execFileSync('git', ['remote', 'get-url', 'origin'], { encoding: 'utf8' }).trim()).toMatch(/^https:\/\/github\.com\/yfgary\/travelpilot-poc(?:\.git)?$/)
  const source = files.map((path) => readFileSync(path, 'utf8')).join('\n')
  expect(source).not.toMatch(/service_role|sb_secret_|trip_checklist_state|trip_checklist_shared|trip_sync_config/)
  expect(source).not.toContain('travelpilot_banner.PNG')
})
test('the one-second clock timer is cleaned up when leaving Today', async ({ page }) => {
  await page.addInitScript(() => {
    const timers = new Set<number>(), originalSet = window.setInterval, originalClear = window.clearInterval
    Object.assign(window, { todayClockTimers: timers })
    window.setInterval = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) => {
      const id = Reflect.apply(originalSet, window, [handler, timeout, ...args]); if (timeout === 1000) timers.add(id); return id
    }) as typeof window.setInterval
    window.clearInterval = ((id?: number) => { if (id !== undefined) timers.delete(id); return originalClear(id) }) as typeof window.clearInterval
  })
  await page.goto('#/trip/demo-trip/today'); await expect(page.getByTestId('today-mode')).toBeVisible()
  expect(await page.evaluate(() => (window as unknown as { todayClockTimers: Set<number> }).todayClockTimers.size)).toBe(1)
  await page.getByRole('navigation', { name: '主導覽' }).getByRole('link', { name: '設定', exact: true }).click()
  await expect(page.getByRole('heading', { name: '設定', level: 1 })).toBeVisible()
  expect(await page.evaluate(() => (window as unknown as { todayClockTimers: Set<number> }).todayClockTimers.size)).toBe(0)
})
