import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { test, expect } from './fixtures'
import { validateTripSnapshot } from '../src/data/schema/trip'
import { airportPacket, restoreAirportPacket } from './japanAirportPacketData'
import { japanVersion, mockJapan } from './japanFixtures'
import { seedAuth } from './tripFixtures'

const bytes = readFileSync('docs/proposals/jp2027-schema6-unpublished-draft.json')
const draft = JSON.parse(bytes.toString())
const manifest = JSON.parse(readFileSync('docs/proposals/jp2027-draft-manifest.json', 'utf8'))
test('Packet4 exact seven fields and five official sources preserve all other candidate bytes', () => {
  expect(validateTripSnapshot(draft)).toMatchObject({ valid: true })
  expect(airportPacket.fields).toHaveLength(7)
  expect(airportPacket.sources).toHaveLength(5)
  restoreAirportPacket(draft)
  const review = JSON.parse(readFileSync('docs/proposals/jp2027-source-review.json', 'utf8'))
  expect(review.airportReview).toMatchObject({ verifiedBy: 'GPT-6', fields: airportPacket.fields, sources: airportPacket.sources, acceptance: { item: 9, status: 'PARTIAL' }, independentCodexResearch: false })
  expect(createHash('sha256').update(bytes).digest('hex')).toBe(manifest.draftSha256)
  expect(manifest).toMatchObject({ published: false, isCurrent: false, authorizedForSupabaseWrite: false })
  const originalBytes = readFileSync('tests/fixtures/japan2027-schema5.json')
  expect(createHash('sha256').update(originalBytes).digest('hex')).toBe('09a0bc1a5b75e50b579fd5ec4596912026cf8311fdf262df0c14ca6e235ea57e')
  const original = JSON.parse(originalBytes.toString())
  // Full pre-packet hash guards all fields; also explicitly guard all day times/offsets.
  for (const day of original.days) {
    const next = draft.days.find((d: { id: string }) => d.id === day.id)
    expect(next.date).toBe(day.date)
    expect(next.routeSummary).toBe(day.routeSummary)
    expect(next.timeline.map((i: { id: string }) => i.id)).toEqual(day.timeline.map((i: { id: string }) => i.id))
    for (const item of day.timeline) {
      const current = next.timeline.find((i: { id: string }) => i.id === item.id)
      for (const key of ['startTime', 'endTime', 'durationMinutes', 'timing', 'placeId', 'transportId', 'accommodationId', 'navigationTargetId']) expect(current[key]).toEqual(item[key])
    }
  }
  for (const flight of draft.transport.filter((t: { type: string }) => t.type === 'flight')) {
    expect(flight).toEqual(original.transport.find((t: { id: string }) => t.id === flight.id))
    expect(flight).not.toHaveProperty('price')
  }
})

for (const view of ['itinerary', 'today']) for (const font of ['small', 'medium', 'large']) test(`Packet4 actual ${view} airport details remain readable at ${font} font`, async ({ page }, info) => {
  await page.addInitScript(size => localStorage.setItem('travelpilot.font-size', size), font)
  await seedAuth(page)
  const requests = await mockJapan(page, { versions: [{ ...japanVersion(), schema_version: 6, data_version: manifest.proposedDataVersion, payload: draft }] })
  await page.goto(`#/trip/${draft.trip.slug}/${view}`)
  await expect(page.getByTestId('trip-versions')).toContainText('Trip Schema Version：6')
  for (const dayId of ['jp27-day-1', 'jp27-day-9']) {
    if (view === 'today') await page.getByRole('navigation', { name: '今日模式行程日期' }).getByRole('button', { name: dayId.endsWith('1') ? 'D1' : 'D9', exact: true }).click()
    const section = view === 'today' ? page.getByTestId('today-mode') : page.locator(`details[data-day-id="${dayId}"]`)
    if (view === 'itinerary' && await section.getAttribute('open') === null) await section.locator('summary').first().click()
    const fields = airportPacket.fields.filter(f => f.dayId === dayId)
    for (const field of fields) {
      if (field.kind === 'highlight') await expect(section).toContainText(field.text)
      else {
        const row = section.locator(`${view === 'today' ? '.today-activities ' : ''}[data-item-id="${field.itemId}"]`)
        await expect(row).toContainText(field.text)
        await row.scrollIntoViewIfNeeded()
        expect(await row.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true)
        if (field.itemId?.endsWith('-airport')) {
          const text = view === 'today' ? row.locator('.place-rich-text').first() : row.locator('.timeline-event > p').first()
          await text.evaluate(node => {
            const main = document.querySelector('main')!
            const bottom = Math.max(...[...document.querySelectorAll('.page-navigation, .day-jump, .content-quick-nav')].map(n => n.getBoundingClientRect().bottom))
            main.scrollTop += node.getBoundingClientRect().top - bottom - 12
          })
          await page.screenshot({ path: info.outputPath(`${view}-${dayId}-airport-${font}.png`) })
        }
      }
    }
    const last = fields.filter(f => f.kind === 'description').at(-1)!
    const row = section.locator(`${view === 'today' ? '.today-activities ' : ''}[data-item-id="${last.itemId}"]`)
    const text = view === 'today' ? row.locator('.place-rich-text').first() : row.locator('.timeline-event > p').first()
    await text.evaluate(node => {
      const main = document.querySelector('main')!
      const bottom = Math.max(...[...document.querySelectorAll('.page-navigation, .day-jump, .content-quick-nav')].map(n => n.getBoundingClientRect().bottom))
      main.scrollTop += node.getBoundingClientRect().top - bottom - 12
    })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({ path: info.outputPath(`${view}-${dayId}-${font}.png`) })
  }
  expect(requests.every(r => r.method === 'GET')).toBe(true)
})
