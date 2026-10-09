import { test, expect } from './fixtures'
import { localTrips } from '../src/data/trips'
import { tripShortcuts } from '../src/data/tripPresentation'

const city = localTrips.find(({ payload }) => payload.trip.slug === 'demo-trip')!.payload
const road = localTrips.find(({ payload }) => payload.trip.slug === 'demo-road-trip')!.payload

test('trip navigation uses the same capability filtering as Home', async ({ page }) => {
  await page.goto('#/trip/demo-trip/itinerary')
  const cityNav = page.getByRole('navigation', { name: '旅程頁面' })
  await expect(cityNav.getByRole('link', { name: 'Live Cam', exact: true })).toHaveCount(0)
  await expect(cityNav.getByRole('link', { name: '景點總覽', exact: true })).toBeVisible()

  await page.goto('#/trip/demo-road-trip/itinerary')
  const roadNav = page.getByRole('navigation', { name: '旅程頁面' })
  await expect(roadNav.getByRole('link', { name: 'Live Cam', exact: true })).toBeVisible()
})

test('direct routes to unavailable capability pages redirect to itinerary', async ({ page }) => {
  await page.goto('#/trip/demo-trip/live')
  await expect(page).toHaveURL(/#\/trip\/demo-trip\/itinerary$/)
  await expect(page.getByRole('heading', { level: 1, name: '詳細行程', exact: true })).toBeVisible()

  await page.goto('#/trip/demo-road-trip/live')
  await expect(page).toHaveURL(/#\/trip\/demo-road-trip\/live$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Live Cam', exact: true })).toBeVisible()
})

test('capability filtering is snapshot-driven rather than trip-specific', () => {
  const empty = structuredClone(city)
  empty.places = []
  empty.liveCams = []
  expect(tripShortcuts(empty).map((page) => page.id)).toEqual(['itinerary', 'info', 'today'])
  expect(tripShortcuts(road).some((page) => page.id === 'live')).toBe(true)
})
