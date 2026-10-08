import { createHash } from 'node:crypto'
import { readFileSync, readdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { test, expect } from './fixtures'
import { derivePlaceUsage } from '../src/data/attractions'
import { cityContent } from './contentFixtures'

const files = ['src/views/AttractionsOverview.tsx', 'src/views/LiveCam.tsx', 'src/data/attractions.ts', 'src/data/liveCams.ts', 'src/components/attractions/AttractionCard.tsx', 'src/components/liveCam/CameraCard.tsx', 'src/components/ContentNavigation.tsx']
test('one canonical loading boundary, PlaceDetail and WeatherPanel serve both views without parallel datasets or media scraping', () => {
  for (const path of files) {
    const code = readFileSync(path, 'utf8')
    expect(code).not.toMatch(/loadTrip\s*\(|supabase|\.from\s*\(|indexedDB|tripCache|fetch\s*\(/)
    expect(code).not.toMatch(/DEFAULT_TRIP|hydrate|Japan2027Core|dynamicBindings|fixedDayBindings|DOMParser|setInterval|setTimeout|\.hostname|youtube|hakuba|gifu/i)
    expect(code).not.toMatch(/demo-trip|demo-road-trip|shirakawa|hokkaido|bangkok|japan/i)
    expect(code).not.toMatch(/(?:trip\.slug|country|dayNumber|placeId|cam\.label)\s*===\s*['"\d]/)
  }
  const attractions = readFileSync('src/views/AttractionsOverview.tsx', 'utf8'), live = readFileSync('src/views/LiveCam.tsx', 'utf8')
  expect(attractions).toContain('useLoadedTrip()'); expect(live).toContain('useLoadedTrip()')
  expect(attractions).toContain("../components/itinerary/PlaceDetail"); expect(live).toContain("../components/weather/WeatherPanel")
  expect(readFileSync('src/views/DetailedItinerary.tsx', 'utf8')).toContain("../components/itinerary/PlaceDetail")
  expect(readFileSync('src/app/App.tsx', 'utf8')).toContain('<AttractionsOverview />'); expect(readFileSync('src/app/App.tsx', 'utf8')).toContain('<LiveCam />')
  function walk(path: string): string[] { return readdirSync(path, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walk(join(path, entry.name)) : [join(path, entry.name)]) }
  const sourceFiles = walk('src')
  expect(sourceFiles.filter((path) => path.endsWith('PlaceDetail.tsx'))).toHaveLength(1)
  for (const path of sourceFiles.filter((path) => !path.includes('demoTrips'))) expect(readFileSync(path, 'utf8')).not.toMatch(/\b(?:catalogPlaces|overviewPlaces)\b|attractions\s*:\s*\[/)
  expect(readFileSync('src/app/App.tsx', 'utf8')).toContain('<TodayMode />'); expect(readFileSync('src/app/App.tsx', 'utf8')).not.toContain('<TripView')
})
test('Step 13 retains original trip/checklist cache, history, Home, Settings, weather/scoring, SQL and canonical assets', () => {
  const protectedPaths = ['supabase', '.github/workflows', 'src/offline', 'src/services/trips.ts', 'src/services/checklists.ts', 'src/services/checklistSync.ts', 'src/data/schema/weather.ts', 'src/data/weather/suitability.ts', 'src/services/weather/alerts.ts', 'src/services/weather/providers', 'src/auth', 'src/app/NavigationHistory.tsx', 'src/views/Home.tsx', 'src/components/TripCard.tsx', 'src/views/Settings.tsx', 'src/components/itinerary/PlaceDetail.tsx', 'assets']
  expect(execFileSync('git', ['diff', 'HEAD', '--', ...protectedPaths], { encoding: 'utf8' })).toBe('')
  expect(execFileSync('git', ['remote', 'get-url', 'origin'], { encoding: 'utf8' }).trim()).toMatch(/^https:\/\/github\.com\/yfgary\/travelpilot-poc(?:\.git)?$/)
  for (const [path, hash] of [
    ['assets/images/travelpilot_banner.PNG', 'f9e41195b72afb12415ac055cf7a73327ad50b984df21e07f70990d315bbc513'],
    ['assets/images/travelpilot_icon.PNG', 'ddab7c01b69509f742a557ab01a85e9f9c37f5995fcdc6131a85114be9f1d6e7'],
    ['supabase/migrations/20261008135932_step11_checklist_client_clock.sql', 'dd7737b5f7dfd695cc5df3550ced00f37889c05481a910ad0134725819012d55'],
  ]) expect(createHash('sha256').update(readFileSync(path)).digest('hex')).toBe(hash)
})
test('frozen Schema 3 fixtures are the exact Step 12 payloads and demo evolution changes only version and camera data', () => {
  for (const name of ['city', 'road']) {
    const path = `src/data/demoTrips/${name}Trip.ts`
    // These hashes were recorded from the exact d9ee4e9 exported payloads in preflight;
    // CI can verify the archived contract even with a shallow checkout.
    const frozenBytes = readFileSync(`tests/fixtures/schema3-${name}.json`)
    const hashes: Record<string, string> = { city: '6a437fe96bca9536f3761ef02eb593648acde8c3c08080030bc2b6f3814282a2', road: 'a945d0552ca7664ae19b0870d614cc8cf5874f3cc57298d534b8a8408a14a4ec' }
    expect(createHash('sha256').update(frozenBytes).digest('hex')).toBe(hashes[name])
    const original = JSON.parse(frozenBytes.toString())
    const current = JSON.parse(readFileSync(path, 'utf8').split('= ')[1])
    expect(current.schemaVersion).toBe(4)
    delete current.schemaVersion; delete original.schemaVersion; delete current.liveCams; delete original.liveCams
    expect(current).toEqual(original)
  }
})
test('place order within a region follows earliest day then status with deterministic name/ID ties without mutating source', () => {
  const snapshot = structuredClone(cityContent)
  snapshot.days.forEach((day) => { day.timeline = []; day.optionalContent = []; day.backupContent = [] })
  const prototype = snapshot.places[0]
  snapshot.places = [
    { ...prototype, id: 'later-place', name: 'A' }, { ...prototype, id: 'backup-place', name: 'A' },
    { ...prototype, id: 'optional-place', name: 'A' }, { ...prototype, id: 'main-z', name: 'Z' }, { ...prototype, id: 'main-a', name: 'A' },
  ]
  snapshot.days[1].timeline = [{ id: 'later-item', type: 'activity', title: '稍後', optional: false, placeId: 'later-place' }]
  snapshot.days[0].timeline = [{ id: 'main-z-item', type: 'activity', title: '主', optional: false, placeId: 'main-z' }, { id: 'main-a-item', type: 'activity', title: '主', optional: false, placeId: 'main-a' }]
  snapshot.days[0].optionalContent = [{ type: 'place', id: 'optional-place' }]; snapshot.days[0].backupContent = [{ type: 'place', id: 'backup-place' }]
  const before = structuredClone(snapshot)
  expect(derivePlaceUsage(snapshot).map((item) => item.place.id)).toEqual(['main-a', 'main-z', 'optional-place', 'backup-place', 'later-place'])
  expect(snapshot).toEqual(before)
})
