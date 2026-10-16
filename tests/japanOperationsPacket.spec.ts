import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { test, expect } from './fixtures'
import { validateTripSnapshot } from '../src/data/schema/trip'
import { operationsPacket as packet, restoreOperationsPacket } from './japanOperationsPacketData'
import { restoreMatsumotoCameraPacket8 } from './japanMatsumotoCameraPacketData'
import { japanVersion, mockJapan } from './japanFixtures'
import { seedAuth } from './tripFixtures'

const bytes = readFileSync('docs/proposals/jp2027-schema6-unpublished-draft.json')
const draft = JSON.parse(bytes.toString())
const manifest = JSON.parse(readFileSync('docs/proposals/jp2027-draft-manifest.json', 'utf8'))
const review = JSON.parse(readFileSync('docs/proposals/jp2027-source-review.json', 'utf8'))
const version = () => ({ ...japanVersion(), schema_version: 6, data_version: manifest.proposedDataVersion, payload: draft })

test('Packet5 exact operational text/source/camera delta preserves full pre-packet SHA and published original', () => {
  expect(validateTripSnapshot(draft)).toMatchObject({ valid: true })
  const before = restoreOperationsPacket(draft)
  expect(packet.fields).toHaveLength(5)
  expect(packet.sources).toHaveLength(6)
  expect(review.operationsPacket5).toMatchObject({ verifiedBy: 'GPT-6', fields: packet.fields, sources: packet.sources, independentCodexResearch: false, acceptance: { status: 'PARTIAL' } })
  expect(review.liveCams.packet5VillageCamera).toMatchObject({ record: packet.camera, playbackVerified: false, embeddingAuthorized: false, browserExternalSiteAccessTested: false, existingTrafficCameraUnchanged: true, acceptance: { item: 25, status: 'BLOCKED' } })
  expect(packet.camera).toMatchObject({ id: 'jp27-cam-shirakawago-village', sourceURL: 'https://kankou.shirakawa-go.org/livecam/', sourceType: 'external', routeDayIds: ['jp27-day-6'], tags: ['村景', '積雪', '展望台', '定時更新'] })
  expect(packet.camera).not.toHaveProperty('previewURL')
  expect(packet.camera.description).toContain('19:00–05:00停止自動更新')
  expect(packet.camera.description).toContain('非本程式內嵌或已認證的即時串流')
  expect(restoreMatsumotoCameraPacket8(draft).liveCams.slice(0, -1)).toEqual(before.liveCams)
  expect(draft.liveCams.find((c: { id: string }) => c.id === 'jp27-cam-shirakawago').sourceURL).toBe('https://shirakawa-going.jp/')
  for (const field of packet.fields.filter(f => f.kind === 'place')) {
    expect(draft.places.find((p: { id: string }) => p.id === field.id).longDescription.split('\n\n')[0]).toBe(before.places.find((p: { id: string; longDescription: string }) => p.id === field.id)!.longDescription!.split('\n\n')[0])
  }
  const aeon = packet.fields.find(f => f.id === 'jp27-tl-d9-aeon')!.text
  expect(aeon).toContain('10:00–11:00先可選購')
  expect(aeon).toContain('11:00必須Hard Cut')
  expect(packet.fields.find(f => f.id === 'jp27-place-miyagawa')!.text).toContain('並非指現時宮川河畔市集自1820年已在同址開設')
  expect(packet.fields.find(f => f.id === 'jp27-tl-d6-view')!.text).toContain('展望台不能私家車駛入')
  expect(createHash('sha256').update(bytes).digest('hex')).toBe(manifest.draftSha256)
  expect(manifest).toMatchObject({ published: false, isCurrent: false, authorizedForSupabaseWrite: false, candidateLabel: 'jp2027-schema6-review-draft-11' })
  expect(createHash('sha256').update(readFileSync('tests/fixtures/japan2027-schema5.json')).digest('hex')).toBe('09a0bc1a5b75e50b579fd5ec4596912026cf8311fdf262df0c14ca6e235ea57e')
})

for (const view of ['itinerary', 'today']) for (const font of ['small', 'medium', 'large']) test(`Packet5 ${view} operational notes readable at ${font}`, async ({ page }, info) => {
  await page.addInitScript(font => localStorage.setItem('travelpilot.font-size', font), font)
  await seedAuth(page); const requests = await mockJapan(page, { versions: [version()] })
  await page.goto(`#/trip/${draft.trip.slug}/${view}`)
  await expect(page.getByTestId('trip-versions')).toContainText('Trip Schema Version：6')
  for (const field of packet.fields.filter(f => f.kind === 'timeline')) {
    if (view === 'today') await page.getByRole('navigation', { name: '今日模式行程日期' }).getByRole('button', { name: field.dayId!.replace('jp27-day-', 'D'), exact: true }).click()
    const section = view === 'today' ? page.getByTestId('today-mode') : page.locator(`details[data-day-id="${field.dayId}"]`)
    if (view === 'itinerary' && await section.getAttribute('open') === null) await section.locator('summary').first().click()
    const row = section.locator(`${view === 'today' ? '.today-activities ' : ''}[data-item-id="${field.id}"]`)
    await expect(row).toContainText(field.text)
    await row.scrollIntoViewIfNeeded()
    expect(await row.evaluate(n => n.scrollWidth <= n.clientWidth)).toBe(true)
    const text = view === 'today' ? row.locator('.place-rich-text').first() : row.locator('.timeline-event > p').first()
    await text.evaluate(node => {
      const main = document.querySelector('main')!
      const bottom = Math.max(...[...document.querySelectorAll('.page-navigation, .day-jump, .content-quick-nav')].map(n => n.getBoundingClientRect().bottom))
      main.scrollTop += node.getBoundingClientRect().top - bottom - 12
    })
    expect(await text.evaluate(n => { const r = n.getBoundingClientRect(); return r.top >= 0 && r.top < innerHeight })).toBe(true)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    if ((info.project.name === 'width-320' && font === 'large') || (['width-390', 'width-1440'].includes(info.project.name) && font === 'medium')) await page.screenshot({ path: info.outputPath(`${view}-${field.dayId}-${font}.png`) })
  }
  expect(requests.every(r => r.method === 'GET')).toBe(true)
})

for (const font of ['small', 'medium', 'large']) test(`Packet5 actual Place paragraphs readable at ${font}`, async ({ page }, info) => {
  await page.addInitScript(font => localStorage.setItem('travelpilot.font-size', font), font)
  await seedAuth(page); await mockJapan(page, { versions: [version()] })
  await page.goto(`#/trip/${draft.trip.slug}/attractions`)
  for (const field of packet.fields.filter(f => f.kind === 'place')) {
    const place = draft.places.find((p: { id: string }) => p.id === field.id)
    await page.getByRole('button', { name: `詳細介紹：${place.name}`, exact: true }).first().click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByTestId('place-detail-introduction')).toContainText(field.text)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    if ((info.project.name === 'width-320' && font === 'large') || (['width-390', 'width-1440'].includes(info.project.name) && font === 'medium')) await page.screenshot({ path: info.outputPath(`place-${field.id}-${font}.png`) })
    await dialog.getByRole('button', { name: '關閉詳細介紹' }).click()
  }
})

for (const font of ['small', 'medium', 'large']) test(`Packet5 scenery camera remains external-only at ${font}`, async ({ page }, info) => {
  await page.addInitScript(font => localStorage.setItem('travelpilot.font-size', font), font)
  const cameraRequests: string[] = []
  await page.route('https://kankou.shirakawa-go.org/**', async route => { cameraRequests.push(route.request().url()); await route.abort() })
  await seedAuth(page); await mockJapan(page, { versions: [version()] })
  await page.goto(`#/trip/${draft.trip.slug}/live`)
  const card = page.locator(`[data-camera-id="${packet.camera.id}"]`)
  await expect(card).toContainText(packet.camera.description!)
  await expect(card.locator('iframe, img, video')).toHaveCount(0)
  const link = card.getByRole('link', { name: `開啟 Live Cam／官方來源：${packet.camera.label}`, exact: true })
  await expect(link).toHaveAttribute('href', packet.camera.sourceURL)
  await expect(link).toHaveAttribute('target', '_blank')
  await expect(link).toHaveAttribute('rel', /noopener/)
  await expect(page.locator('[data-camera-id="jp27-cam-shirakawago"]')).toBeAttached()
  await card.scrollIntoViewIfNeeded()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  expect(cameraRequests).toEqual([])
  if ((info.project.name === 'width-320' && font === 'large') || (['width-390', 'width-1440'].includes(info.project.name) && font === 'medium')) {
    await card.locator('h3').evaluate(node => {
      const main = document.querySelector('main')!
      const bottom = document.querySelector('.trip-navigation')!.getBoundingClientRect().bottom
      main.scrollTop += node.getBoundingClientRect().top - bottom - 12
    })
    await page.screenshot({ path: info.outputPath(`camera-${font}.png`) })
    await link.scrollIntoViewIfNeeded()
    await page.screenshot({ path: info.outputPath(`camera-action-${font}.png`) })
  }
})
