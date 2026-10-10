import { readFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { test, expect } from './fixtures'
import { validateTripSnapshot } from '../src/data/schema/trip'

const originalBytes = readFileSync('tests/fixtures/japan2027-schema5.json')
const original = JSON.parse(originalBytes.toString())
const draft = JSON.parse(readFileSync('docs/proposals/jp2027-schema6-unpublished-draft.json', 'utf8'))
const manifest = JSON.parse(readFileSync('docs/proposals/jp2027-draft-manifest.json', 'utf8'))

test('unpublished Japan candidate validates strict Schema6 and preserves canonical identity/timing', () => {
  const result = validateTripSnapshot(draft)
  expect(result.valid, result.valid ? '' : JSON.stringify(result.issues)).toBe(true)
  expect(draft.schemaVersion).toBe(6)
  expect(createHash('sha256').update(originalBytes).digest('hex')).toBe('09a0bc1a5b75e50b579fd5ec4596912026cf8311fdf262df0c14ca6e235ea57e')
  expect(draft.trip).toEqual(original.trip)
  expect(draft.days).toHaveLength(9)
  for (const day of original.days) {
    const candidate = draft.days.find((x: { id: string }) => x.id === day.id)
    expect(candidate.date).toBe(day.date)
    expect(candidate.routeSummary).toBe(day.routeSummary)
    for (const item of day.timeline) {
      const next = candidate.timeline.find((x: { id: string }) => x.id === item.id)
      for (const key of ['id', 'type', 'startTime', 'endTime', 'durationMinutes', 'timing', 'placeId', 'accommodationId', 'transportId', 'navigationTargetId', 'hardCutId', 'optional', 'bonus']) expect(next[key], `${item.id}.${key}`).toEqual(item[key])
    }
    expect(candidate.timeline).toHaveLength(day.timeline.length)
  }
  const dayOne = draft.days[0]
  expect(dayOne.timeline.find((x: { id: string }) => x.id === 'jp27-tl-d1-projection')).toMatchObject({ startTime: '20:20', endTime: '21:00', optional: true })
  expect(dayOne.backupContent).toContainEqual({ type: 'place', id: 'jp27-place-nawate' })
  expect(dayOne.timeline.some((x: { placeId?: string }) => x.placeId === 'jp27-place-nawate')).toBe(false)
  for (const image of draft.images) if (image.url?.startsWith('assets/')) expect(existsSync(image.url), image.id).toBe(true)
  expect(manifest).toMatchObject({ published: false, isCurrent: false, authorizedForSupabaseWrite: false, parentDataVersion: 'jp2027.1' })
})

import { japanVersion, mockJapan } from './japanFixtures'
import { seedAuth, cacheContents } from './tripFixtures'
const review = JSON.parse(readFileSync('docs/proposals/jp2027-source-review.json', 'utf8'))
const version = () => ({ ...japanVersion(), schema_version: 6, data_version: manifest.proposedDataVersion, payload: structuredClone(draft) })

test('content evidence covers original 36 Places and qualifies prices/media without changing protected content', () => {
  expect(review.places).toHaveLength(36)
  expect(review.places.map((p: { id: string }) => p.id).sort()).toEqual(original.places.map((p: { id: string }) => p.id).sort())
  for (const entry of review.places) {
    const place = draft.places.find((p: { id: string }) => p.id === entry.id)
    expect(place.localName).toBe(entry.localName)
    expect(place.longDescription.split('\n\n')).toHaveLength(2)
    expect(place.longDescription.split('\n\n')).toEqual(entry.facts)
    expect(draft.sources.some((s: { url: string; entity?: { id: string } }) => entry.urls.includes(s.url) && s.entity?.id === place.id)).toBe(true)
    expect(entry.notReverified).toContain('existing fee/opening/lastEntry/closing')
  }
  expect(draft.images).toEqual(original.images)
  expect(draft.liveCams).toEqual(original.liveCams)
  expect(draft.navigationTargets).toEqual(original.navigationTargets)
  for (const key of ['regions', 'weather', 'hardCuts', 'checklists']) expect(draft[key]).toEqual(original[key])
  for (const stay of original.accommodations) {
    const next = { ...draft.accommodations.find((s: { id: string }) => s.id === stay.id) }
    delete next.localName
    expect(next).toEqual(stay)
  }
  for (const transport of original.transport) {
    const next = draft.transport.find((t: { id: string }) => t.id === transport.id)
    for (const key of ['departure', 'arrival', 'durationMinutes', 'bookingState', 'paymentState', 'navigationTargetIds']) expect(next[key]).toEqual(transport[key])
  }
  for (const id of ['meitetsu-out', 'meitetsu-return']) {
    const transport = draft.transport.find((t: { id: string }) => t.id === `jp27-transport-${id}`)
    expect(transport.price).toMatchObject({ amount: 1430, currency: 'JPY' })
    expect(transport.price.notes).toContain('不是已付款金額或2027年1月報價')
  }
  expect(review.daytimePhoto.status).toContain('HTTP 403')
  expect(review.liveCams.additionalCandidate.playbackVerified).toBe(false)
  expect(createHash('sha256').update(readFileSync('docs/proposals/jp2027-schema6-unpublished-draft.json')).digest('hex')).toBe(manifest.draftSha256)
  expect(readFileSync('src/data/trips.ts', 'utf8')).not.toContain('proposals')
})

for (const view of ['itinerary', 'info', 'attractions', 'live', 'today']) test(`unpublished Schema6 ${view} renders/reloads only via mocked review response`, async ({ page }) => {
  await seedAuth(page)
  const requests = await mockJapan(page, { versions: [version()] })
  await page.goto(`#/trip/${draft.trip.slug}/${view}`)
  await expect(page.getByTestId('trip-versions')).toContainText(`${manifest.proposedDataVersion} · Trip Schema Version：6`)
  await expect(page.locator('.trip-heading h2')).toHaveText(draft.trip.title)
  await page.reload()
  await expect(page.getByTestId('trip-versions')).toContainText(manifest.proposedDataVersion)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  expect(requests.every(r => r.method === 'GET')).toBe(true)
})

for (const font of ['small', 'medium', 'large']) test(`unpublished content/native names are readable at ${font} font and retain offline cache`, async ({ page }, info) => {
  await page.addInitScript(font => localStorage.setItem('travelpilot.font-size', font), font)
  await seedAuth(page); await mockJapan(page, { versions: [version()] })
  await page.goto(`#/trip/${draft.trip.slug}/attractions`)
  await expect(page.locator('.trip-heading h2')).toHaveText(draft.trip.title)
  // Every original Place remains reachable through the existing generic detail dialog.
  for (const place of draft.places) {
    const action = page.getByRole('button', { name: `詳細介紹：${place.name}`, exact: true }).first()
    await action.click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByTestId('native-name')).toHaveText(place.localName)
    const introduction = dialog.getByTestId('place-detail-introduction')
    for (const paragraph of place.longDescription.split('\n\n')) await expect(introduction).toContainText(paragraph)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    if (place.id === 'jp27-place-matsumoto-castle') await page.screenshot({ path: info.outputPath(`castle-${font}.png`) })
    await dialog.getByRole('button', { name: '關閉詳細介紹' }).click()
  }
  const before = await cacheContents(page)
  await page.evaluate(() => localStorage.removeItem(Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'))!))
  await page.reload()
  await expect(page.getByTestId('trip-source')).toContainText('cache')
  expect(await cacheContents(page)).toEqual(before)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('unpublished itinerary preserves D1 choice and D1/D9 exact datetime semantics', async ({ page }) => {
  await seedAuth(page); await mockJapan(page, { versions: [version()] })
  await page.goto(`#/trip/${draft.trip.slug}/itinerary`)
  await expect(page.getByTestId('trip-versions')).toContainText(manifest.proposedDataVersion)
  for (const n of [1, 6, 7, 8, 9]) {
    const day = draft.days.find((d: { dayNumber: number }) => d.dayNumber === n)
    const section = page.locator(`details[data-day-id="${day.id}"]`)
    if (await section.getAttribute('open') === null) await section.locator('summary').first().click()
    await expect(section).toContainText(day.routeSummary)
    for (const item of day.timeline.filter((i: { timing?: unknown }) => i.timing)) for (const endpoint of [item.timing.start, item.timing.end]) {
      await expect(section.locator(`time[datetime="${endpoint.dateTime}"]`)).toContainText(endpoint.timeZone)
    }
  }
  const dayOne = page.locator('details[data-day-id="jp27-day-1"]')
  await expect(dayOne).toContainText('繩手通')
  await expect(dayOne).toContainText('20:20')
})
