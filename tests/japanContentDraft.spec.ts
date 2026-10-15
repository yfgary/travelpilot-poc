import { waitForInitialTrip } from './tripReadiness'
import { readFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { test as base, expect } from './fixtures'
import { createStageTiming } from './stageTiming'

const test = base.extend<{ stageTiming: Awaited<ReturnType<typeof createStageTiming>> }>({
  stageTiming: [async ({ page }, use, info) => {
    const timing = await createStageTiming(page, info)
    try { await use(timing) } finally { await timing.finish() }
  }, { auto: true }],
})
import { restoreOperationsPacket } from './japanOperationsPacketData'
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
  expect(restoreOperationsPacket(draft).liveCams).toEqual(original.liveCams)
  expect(draft.navigationTargets.map(({localName, ...target}:{localName?:string;[key:string]:unknown})=>target)).toEqual(original.navigationTargets)
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


test('GPT-6 Snow Monkey packet preserves ticket types, advisory arrival and immutable original', () => {
  const place = draft.places.find((p: { id: string }) => p.id === 'jp27-place-snow-monkey')
  expect(place.fee).toEqual({ amount: 1000, currency: 'JPY' })
  expect(place.feeNotes).toBe("官方2026/09/20公告：由2026/12/01起，成人（18歲或以上）一般票¥1,000；成人Web指定日期票¥880。小學生至高中生一般¥500／Web¥440；6歲以下監護人陪同免費。冬季Web票持有人優先入苑，但不保證免排隊或必定入場。價格為官方公告非已付款金額；2027出發前再查。官方冬季09:00–16:00，建議最遲15:30前到達（不是已核實的硬性最後入場時間）。")
  expect(place).not.toHaveProperty('lastEntry')
  expect(place).toMatchObject({ opening: '09:00', closing: '16:00' })
  const paragraphs = place.longDescription.split('\n\n')
  expect(paragraphs).toHaveLength(2)
  expect(paragraphs[0]).toBe("野猿公苑觀察的是自由活動的野生猴羣，不是動物園定時表演。冬季可觀察牠們在寒冷環境中的行為，但到場數目、出現時間及是否浸溫泉都不能保證；保持距離，不餵食、不觸摸。")
  expect(paragraphs[1]).toBe("官方冬季11月至3月09:00–16:00，建議關門前30分鐘到達，並未公告15:30是嚴格最後入場時間。2026/12/01起成人一般入苑¥1,000，Web指定日期票¥880；12月至4月Web票有優先入苑安排，但不能保證猴群必定出現或沒有等候。天氣、野生猴群或人數管制可能導致臨時改變安排，出發前再查官方。")
  const source = draft.sources.find((s: { id: string }) => s.id === 'jp27-source-gpt6-snow-monkey-fee-table')
  expect(source).toMatchObject({ url: "https://jigokudani-yaenkoen.co.jp/wp-content/uploads/2026/09/8e706a84d13cb2800302700fed5ffb5d-834x1180.jpg", type: 'official', entity: { type: 'place', id: place.id } })
  expect(place.sourceIds).toContain(source.id)
  const evidence = review.places.find((p: { id: string }) => p.id === place.id)
  expect(evidence.facts).toEqual(paragraphs)
  expect(evidence.verifiedFields).toContain('fee')
  expect(evidence.verifiedFields).not.toContain('lastEntry')
  expect(evidence.operationalReview.verification.verifiedBy).toBe('GPT-6')
  expect(evidence.operationalReview.removedFields).toContain('lastEntry')
  expect(original.places.find((p: { id: string }) => p.id === place.id).lastEntry).toBe('15:30')
  expect(createHash('sha256').update(originalBytes).digest('hex')).toBe('09a0bc1a5b75e50b579fd5ec4596912026cf8311fdf262df0c14ca6e235ea57e')
})

for (const view of ['itinerary', 'info', 'attractions', 'live', 'today']) test(`unpublished Schema6 ${view} renders/reloads only via mocked review response`, async ({ page }) => {
  await seedAuth(page)
  const requests = await mockJapan(page, { versions: [version()] })
  await page.goto(`#/trip/${draft.trip.slug}/${view}`)
  await waitForInitialTrip(page, draft.trip.slug)
  await expect(page.getByTestId('trip-versions')).toContainText(`${manifest.proposedDataVersion} · Trip Schema Version：6`)
  await expect(page.locator('.trip-heading h2')).toHaveText(draft.trip.title)
  await page.reload()
  await waitForInitialTrip(page, draft.trip.slug)
  await expect(page.getByTestId('trip-versions')).toContainText(manifest.proposedDataVersion)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  expect(requests.every(r => r.method === 'GET')).toBe(true)
})

// Bound each independent browser workflow without dropping any Place/font/viewport.
const placesPerGroup = 10
const placeGroups = Array.from({ length: Math.ceil(draft.places.length / placesPerGroup) }, (_, index) => ({
  label: `group ${index + 1} (${index * placesPerGroup + 1}–${Math.min((index + 1) * placesPerGroup, draft.places.length)})`,
  places: draft.places.slice(index * placesPerGroup, (index + 1) * placesPerGroup) as typeof draft.places,
}))

test('content groups cover all 37 Places exactly once in canonical order', () => {
  const ids = placeGroups.flatMap(group => group.places.map((place: { id: string }) => place.id))
  expect(ids).toEqual(draft.places.map((place: { id: string }) => place.id))
  expect(ids).toHaveLength(37)
  expect(new Set(ids).size).toBe(ids.length)
  for (const group of placeGroups) {
    expect(group.places.length).toBeGreaterThanOrEqual(7)
    expect(group.places.length).toBeLessThanOrEqual(placesPerGroup)
  }
})

for (const font of ['small', 'medium', 'large']) {
  for (const group of placeGroups) test(`unpublished content/native names ${group.label} are readable at ${font} font without cache mutation`, async ({ page, stageTiming }, info) => {
    await stageTiming.measure('setup.font-auth-mocks', async () => {
      await page.addInitScript(font => localStorage.setItem('travelpilot.font-size', font), font)
      await seedAuth(page); await mockJapan(page, { versions: [version()] })
    })
    await stageTiming.measure('navigation', () => page.goto(`#/trip/${draft.trip.slug}/attractions`))
    await stageTiming.measure('trip.initial-readiness', () => waitForInitialTrip(page, draft.trip.slug))
    await stageTiming.measure('heading.readiness', () => expect(page.locator('.trip-heading h2')).toHaveText(draft.trip.title))
    const before = await stageTiming.measure('cache.before', () => cacheContents(page))
    for (const place of group.places) {
      const action = page.getByRole('button', { name: `詳細介紹：${place.name}`, exact: true }).first()
      await stageTiming.measure(`${place.id}.open`, () => action.click())
      await stageTiming.measure(`${place.id}.validate`, async () => {
        const dialog = page.getByRole('dialog')
        await expect(dialog.getByTestId('native-name')).toHaveText(place.localName)
        const introduction = dialog.getByTestId('place-detail-introduction')
        for (const paragraph of place.longDescription.split('\n\n')) await expect(introduction).toContainText(paragraph)
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
        if (place.id === 'jp27-place-snow-monkey') {
          await expect(dialog).toContainText('JPY 1,000')
          await expect(dialog).toContainText(place.feeNotes)
          await expect(dialog.locator('dt', { hasText: '最後入場' })).toHaveCount(0)
          await expect(introduction).toContainText('並未公告15:30是嚴格最後入場時間')
        }
      })
      if (place.id === 'jp27-place-matsumoto-castle') await stageTiming.measure(`${place.id}.screenshot`, () => page.screenshot({ path: info.outputPath(`castle-${font}.png`) }))
      await stageTiming.measure(`${place.id}.close`, () => page.getByRole('dialog').getByRole('button', { name: '關閉詳細介紹' }).click())
    }
    await stageTiming.measure('cache.equality', async () => expect(await cacheContents(page)).toEqual(before))
  })

  test(`unpublished content retains signed-out offline cache after reload at ${font} font`, async ({ page, stageTiming }) => {
    await stageTiming.measure('setup.font-auth-mocks', async () => {
      await page.addInitScript(font => localStorage.setItem('travelpilot.font-size', font), font)
      await seedAuth(page); await mockJapan(page, { versions: [version()] })
    })
    await stageTiming.measure('navigation', () => page.goto(`#/trip/${draft.trip.slug}/attractions`))
    await stageTiming.measure('trip.initial-readiness', () => waitForInitialTrip(page, draft.trip.slug))
    await stageTiming.measure('heading.readiness', () => expect(page.locator('.trip-heading h2')).toHaveText(draft.trip.title))
    const before = await stageTiming.measure('cache.before', () => cacheContents(page))
    await stageTiming.measure('auth.remove-token', () => page.evaluate(() => localStorage.removeItem(Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'))!)))
    await stageTiming.measure('reload.navigation', () => page.reload())
    await stageTiming.measure('reload.initial-readiness', () => waitForInitialTrip(page, draft.trip.slug))
    await stageTiming.measure('reload.cache-readiness', () => expect(page.getByTestId('trip-source')).toContainText('cache'))
    await stageTiming.measure('trip.initial-readiness', () => waitForInitialTrip(page, draft.trip.slug))
    await stageTiming.measure('heading.readiness', () => expect(page.locator('.trip-heading h2')).toHaveText(draft.trip.title))
    await stageTiming.measure('cache.equality', async () => expect(await cacheContents(page)).toEqual(before))
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })
}

test('unpublished itinerary preserves D1 choice and D1/D9 exact datetime semantics', async ({ page }) => {
  await seedAuth(page); await mockJapan(page, { versions: [version()] })
  await page.goto(`#/trip/${draft.trip.slug}/itinerary`)
  await waitForInitialTrip(page, draft.trip.slug)
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
