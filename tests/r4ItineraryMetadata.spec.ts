import { test, expect } from './fixtures'
import { localTrips } from '../src/data/trips'
import { formatMoney, accommodationTypeLabel } from '../src/data/itinerary'

const city = localTrips.find(({ payload }) => payload.trip.slug === 'demo-trip')!.payload
const road = localTrips.find(({ payload }) => payload.trip.slug === 'demo-road-trip')!.payload

test('recorded fare displayed prominently, unknown paid-mode cost marked honestly', async ({ page }) => {
  await page.goto('#/trip/demo-trip/info')
  const transport = page.locator('.transport-card')
  const priced = transport.filter({ hasText: city.transport[0].service! }).first()
  await expect(priced.getByTestId('transport-price')).toContainText(formatMoney(city.transport[0].price)!)
  await expect(priced.getByTestId('transport-price')).toContainText('費用：')
  const walking = transport.filter({ hasText: city.transport[1].origin }).first()
  await expect(walking.getByTestId('transport-price')).toHaveCount(0)
  await expect(walking.getByTestId('transport-price-unknown')).toHaveCount(0)
  await page.goto('#/trip/demo-road-trip/info')
  const car = page.locator('.transport-card').filter({ hasText: road.transport[0].service! }).first()
  await expect(car).toBeVisible()
  if (road.transport[0].price) await expect(car.getByTestId('transport-price')).toContainText(formatMoney(road.transport[0].price)!)
  else await expect(car.getByTestId('transport-price-unknown')).toContainText('未提供，請核實')
})

test('known English lodging codes display in Chinese on reusable accommodation cards', async ({ page }) => {
  await page.goto('#/trip/demo-road-trip/info')
  const cards = page.locator('.accommodation-card')
  await expect(cards).toHaveCount(road.accommodations.length)
  for (const stay of road.accommodations) {
    const card = cards.filter({ hasText: stay.name }).first()
    await expect(card).toContainText(accommodationTypeLabel(stay.type))
    await expect(card.locator('dl').first()).toBeVisible()
  }
  await page.goto('#/trip/demo-trip/info')
  await expect(page.locator('.accommodation-card').first()).toContainText('酒店')
})
