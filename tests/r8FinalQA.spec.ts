import { test, expect } from './fixtures'
import { accommodationTypeLabel } from '../src/data/itinerary'
import { validateTripSnapshot, type TripSnapshot } from '../src/data/schema/trip'
import { legacyRoad } from './legacySnapshots'
import { roadContent } from './contentFixtures'
import { cacheContents, mockRemote, remoteVersion, remoteSlug, seedAuth } from './tripFixtures'
import { japan, mockJapan } from './japanFixtures'

const labels: Record<string, string> = { 'onsen hotel': '溫泉酒店', 'onsen-hotel': '溫泉酒店', 'apartment hotel': '公寓式酒店', 'apartment-hotel': '公寓式酒店' }
test('R8 known compound lodging categories use Chinese without translating unknown authored values', () => {
  for (const [code, label] of Object.entries(labels)) {
    expect(accommodationTypeLabel(code)).toBe(label)
    expect(accommodationTypeLabel(`  ${code.toUpperCase()}  `)).toBe(label)
  }
  for (const [code, label] of [['hotel', '酒店'], ['ryokan', '日式旅館'], ['aparthotel', '服務式公寓'], ['onsen ryokan', '溫泉旅館'], ['商務旅館', '商務旅館'], ['unverified-custom-category', 'unverified-custom-category']]) expect(accommodationTypeLabel(code)).toBe(label)
})

for (const font of ['small', 'medium', 'large']) test(`R8 immutable Japan lodging labels stay Chinese in info/itinerary at ${font} font`, async ({ page }, info) => {
  await page.addInitScript(font => localStorage.setItem('travelpilot.font-size', font), font)
  await seedAuth(page); await mockJapan(page)
  await page.goto(`#/trip/${japan.trip.slug}/info`)
  await expect(page.getByTestId('trip-information')).toBeVisible()
  const original = await cacheContents(page)
  for (const stay of japan.accommodations.filter(stay => labels[stay.type])) {
    const card = page.locator(`[data-entity-id="${stay.id}"]`)
    await expect(card.locator('dt').filter({ hasText: /^類型$/ }).locator('..').locator('dd')).toHaveText(labels[stay.type])
    await expect(card).toContainText(stay.name)
  }
  const apartment = japan.accommodations.find(stay => stay.type === 'apartment hotel')!
  const apartmentCard = page.locator(`[data-entity-id="${apartment.id}"]`)
  await apartmentCard.getByText('公寓式酒店', { exact: true }).scrollIntoViewIfNeeded()
  await page.screenshot({ path: info.outputPath(`lodging-labels-${font}.png`) })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.goto(`#/trip/${japan.trip.slug}/itinerary`)
  for (const stay of japan.accommodations.filter(stay => labels[stay.type])) {
    const day = japan.days.find(day => day.accommodationId === stay.id)!
    const section = page.locator(`details[data-day-id="${day.id}"]`)
    if (await section.getAttribute('open') === null) await section.locator('summary').first().click()
    await expect(section.locator(`[data-entity-id="${stay.id}"]`).first()).toContainText(labels[stay.type])
  }
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await expect(page.getByTestId('trip-source')).toContainText('cache')
  await expect(page.getByTestId('trip-versions')).toContainText('jp2027.1')
  expect(await cacheContents(page)).toEqual(original)
})

for (const version of [1, 6]) test(`R8 compound categories work through Schema ${version} generic remote/cache rendering`, async ({ page }) => {
  const payload = structuredClone(version === 1 ? legacyRoad : roadContent) as TripSnapshot
  payload.schemaVersion = version as 1 | 6
  payload.trip = { ...payload.trip, id: remoteVersion().trip_id, slug: remoteSlug }
  payload.accommodations[0].type = 'onsen-hotel'
  payload.accommodations[1].type = 'apartment-hotel'
  expect(validateTripSnapshot(payload)).toMatchObject({ valid: true })
  await seedAuth(page)
  await mockRemote(page, () => ({ ...remoteVersion(), schema_version: version, payload }))
  await page.goto(`#/trip/${remoteSlug}/info`)
  await expect(page.getByTestId('trip-information')).toBeVisible()
  for (const stay of payload.accommodations.slice(0, 2)) await expect(page.locator(`[data-entity-id="${stay.id}"]`)).toContainText(labels[stay.type])
  const original = await cacheContents(page)
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await expect(page.getByTestId('trip-source')).toContainText('cache')
  for (const stay of payload.accommodations.slice(0, 2)) await expect(page.locator(`[data-entity-id="${stay.id}"]`)).toContainText(labels[stay.type])
  expect(await cacheContents(page)).toEqual(original)
})
