import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { test, expect } from './fixtures'
import { validateTripSnapshot } from '../src/data/schema/trip'
import { railPrices, railSources } from './japanRailPacketData'
import { japanVersion, mockJapan } from './japanFixtures'
import { seedAuth } from './tripFixtures'

const bytes = readFileSync('docs/proposals/jp2027-schema6-unpublished-draft.json')
const draft = JSON.parse(bytes.toString())
const ledger = JSON.parse(readFileSync('docs/proposals/jp2027-source-review.json', 'utf8'))
const manifest = JSON.parse(readFileSync('docs/proposals/jp2027-draft-manifest.json', 'utf8'))

test('Packet3 exact rail fares and provenance are the only changes to Packet2 candidate', () => {
  expect(validateTripSnapshot(draft)).toMatchObject({ valid: true })
  const restored = structuredClone(draft)
  for (const record of railPrices) {
    const transport = restored.transport.find((t: { id: string }) => t.id === record.id)
    expect(transport.price).toEqual(record.price)
    delete transport.price
  }
  expect(restored.sources.slice(-4)).toEqual(railSources)
  restored.sources = restored.sources.slice(0, -4)
  expect(createHash('sha256').update(JSON.stringify(restored, null, 2) + '\n').digest('hex')).toBe('89473863e779de33a0d627bfec7812b5ad33b4b0845d76735885d27b3ad4513d')
  expect(ledger.fares.shinano).toMatchObject({ verifiedBy: 'GPT-6', referenceRevision: '2026-03', season: 'ordinary', seat: 'ordinary reserved seat', total: 6160, bookingPaymentConfirmed: false, entries: railPrices, sources: railSources })
  expect(ledger.fares.unresolved).toContain('all six actual booking/payment amounts')
  expect(createHash('sha256').update(bytes).digest('hex')).toBe(manifest.draftSha256)
  expect(manifest).toMatchObject({ published: false, isCurrent: false, authorizedForSupabaseWrite: false })
  const originalBytes = readFileSync('tests/fixtures/japan2027-schema5.json')
  expect(createHash('sha256').update(originalBytes).digest('hex')).toBe('09a0bc1a5b75e50b579fd5ec4596912026cf8311fdf262df0c14ca6e235ea57e')
  const original = JSON.parse(originalBytes.toString())
  for (const flight of draft.transport.filter((t: { type: string }) => t.type === 'flight')) {
    expect(flight).toEqual(original.transport.find((t: { id: string }) => t.id === flight.id))
    expect(flight).not.toHaveProperty('price')
  }
  expect(readFileSync('tests/japanRoadsidePacket.spec.ts', 'utf8')).not.toMatch(/execFileSync|child_process|git.*show/)
})

for (const font of ['small', 'medium', 'large']) test(`Shinano references show qualified fares without claiming payment at ${font} font`, async ({ page }, info) => {
  await page.addInitScript(size => localStorage.setItem('travelpilot.font-size', size), font)
  await seedAuth(page)
  const requests = await mockJapan(page, { versions: [{ ...japanVersion(), schema_version: 6, data_version: manifest.proposedDataVersion, payload: draft }] })
  await page.goto(`#/trip/${draft.trip.slug}/info`)
  await expect(page.getByTestId('trip-versions')).toContainText('Trip Schema Version：6')
  const cards = page.locator('.info-transport .transport-card').filter({ hasText: '特急しなの 規劃班次' })
  await expect(cards).toHaveCount(2)
  for (const [index, record] of railPrices.entries()) {
    const card = cards.nth(index)
    await expect(card.getByTestId('transport-price')).toContainText('JPY 6,160')
    await expect(card.getByTestId('transport-price')).toContainText(record.price.notes)
    await expect(card).toContainText('2027正式時刻待核對')
    await expect(card.getByTestId('transport-price')).toContainText('非已購票／已付款金額')
    await card.scrollIntoViewIfNeeded()
    expect(await card.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await card.getByTestId('transport-price').evaluate(node => {
      const main = document.querySelector('main')!
      const bottom = Math.max(...[...document.querySelectorAll('.page-navigation, .info-quick-nav')].map(n => n.getBoundingClientRect().bottom))
      main.scrollTop += node.getBoundingClientRect().top - bottom - 12
    })
    await page.screenshot({ path: info.outputPath(`shinano-${index}-${font}.png`) })
  }
  const flights = page.locator('.info-transport .transport-card').filter({ hasText: /UO680|UO685/ })
  await expect(flights.getByTestId('transport-price-unknown')).toHaveCount(2)
  expect(requests.every(r => r.method === 'GET')).toBe(true)
})
