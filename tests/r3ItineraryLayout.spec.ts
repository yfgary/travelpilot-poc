import { test, expect } from './fixtures'
import { localTrips } from '../src/data/trips'
import { renderGallery } from './itineraryHarness'

const road = localTrips.find(({ payload }) => payload.trip.slug === 'demo-road-trip')!.payload

test('generic day jump displays each destination/day heading without hardcoded trip names', async ({ page }) => {
  await page.goto('#/trip/demo-road-trip/itinerary')
  const nav = page.getByRole('navigation', { name: '行程日期' })
  const buttons = nav.getByRole('button')
  await expect(buttons).toHaveCount(road.days.length)
  const days = [...road.days].sort((a, b) => a.dayNumber - b.dayNumber)
  for (const [i, day] of days.entries()) {
    await expect(buttons.nth(i).locator('.day-jump-number')).toHaveText(`D${day.dayNumber}`)
    await expect(buttons.nth(i).locator('.day-jump-destination')).toHaveText(day.title)
    await expect(buttons.nth(i)).toHaveAttribute('title', day.title)
    await expect(buttons.nth(i)).toHaveAttribute('aria-label', `跳至 DAY ${day.dayNumber}`)
  }
  await expect(buttons.last()).toBeVisible()
  expect(await page.locator('main').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
})

test('mapped item names place Maps link inline; full lodging facts survive density change', async ({ page }) => {
  await page.goto('#/trip/demo-road-trip/itinerary')
  const day = page.locator('.itinerary-day').first()
  await expect(day).toHaveAttribute('open', '')
  const lodging = day.locator('.day-accommodation .accommodation-card')
  await expect(lodging).toBeVisible()
  await expect(lodging.locator('h4 .itinerary-action')).toHaveCount(1)
  const stay = road.accommodations.find((a) => a.id === road.days[0].accommodationId)!
  await expect(lodging).toContainText(stay.name)
  for (const value of [stay.checkIn, stay.checkOut, stay.parking, stay.cancellation].filter(Boolean)) await expect(lodging).toContainText(value!)
  for (const note of stay.notes) await expect(lodging).toContainText(note)
  await expect(lodging.locator('.accommodation-grid')).toBeVisible()
  const place = day.locator('.place-card').first()
  if (await place.count()) await expect(place.locator('h4 .itinerary-action')).toHaveCount(1)
  expect(await page.locator('main').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
})

test('gallery 3 = large-left plus two stacked; gallery 2 remains aligned', async ({ page }) => {
  const images = [...road.images, ...localTrips[1].payload.images].filter((i) => !i.url.includes('travelpilot_banner')).slice(0, 3)
  expect(images).toHaveLength(3)
  await renderGallery(page, { imageIds: images.map((i) => i.id), images })
  let figures = page.getByTestId('day-gallery').locator('figure')
  await expect(figures).toHaveCount(3)
  let rects = await figures.evaluateAll((els) => els.map((el) => {
    const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }
  }))
  if (page.viewportSize()!.width > 700) {
    expect(rects[0].width).toBeGreaterThan(rects[1].width)
    expect(rects[1].x).toBeGreaterThan(rects[0].x)
    expect(rects[2].y).toBeGreaterThan(rects[1].y)
    expect(Math.abs(rects[0].height - (rects[2].y + rects[2].height - rects[1].y))).toBeLessThan(3)
  } else {
    expect(rects[1].y).toBeGreaterThan(rects[0].y)
    expect(Math.abs(rects[1].y - rects[2].y)).toBeLessThan(3)
  }
  await renderGallery(page, { imageIds: images.slice(0, 2).map((i) => i.id), images })
  figures = page.getByTestId('day-gallery').locator('figure')
  await expect(figures).toHaveCount(2)
  rects = await figures.evaluateAll((els) => els.map((el) => {
    const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }
  }))
  expect(Math.abs(rects[0].y - rects[1].y)).toBeLessThan(3)
  expect(Math.abs(rects[0].height - rects[1].height)).toBeLessThan(3)
})
