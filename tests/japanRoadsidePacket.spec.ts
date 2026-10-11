import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { test, expect } from './fixtures'
import { validateTripSnapshot } from '../src/data/schema/trip'
import { mockJapan, japanVersion } from './japanFixtures'
import { seedAuth } from './tripFixtures'

const path = 'docs/proposals/jp2027-schema6-unpublished-draft.json'
const draft = JSON.parse(readFileSync(path, 'utf8'))
// Fixed pre-packet checkpoint: proves the complete delta, including unmentioned fields.
const before = JSON.parse(execFileSync('git', ['show', `0417838cd2351baeba0fccb1baf5041d391a044f:${path}`], { encoding: 'utf8' }))
const notes = [
  { id: 'jp27-tl-d7-drive-shinhotaka', day: 'jp27-day-7', sourceId: 'jp27-source-gpt6-d7-kamitakara', url: 'https://okuhida-camp.com/michinoeki/index.html', text: '如實際導航經奧飛驒田頃家，可視天氣、時間及安全需要，以「道の駅 奥飛騨温泉郷上宝」作可選短休息站；營運者列冬季11–3月物產館09:00–16:30，個別餐飲有不同休息日，露營場不是冬季必然開放。唔係已核實必經站，更唔應壓縮纜車時間；臨行查路況和當日營業。' },
  { id: 'jp27-tl-d8-drive-matsumoto', day: 'jp27-day-8', sourceId: 'jp27-source-gpt6-d8-fuketsu', url: 'https://www.city.matsumoto.nagano.jp/soshiki/72/4345.html', text: '如飛驒大鐘乳洞返松本實際採R158並經過「道の駅 風穴の里」，可在安全可行時作可選短休／洗手間；松本市資料指停車場及洗手間24小時，商店09:00–17:00、餐廳09:30–16:00，冬季逢星期四店舖休息且風穴景點冬季關閉。該處不是必停；如因路況或安全停車而延誤，實際ETA需另作調整，不能為趕原定17:30到松本而冒險。' },
]

test('GPT-6 packet2 changes only two descriptions and two timeline-bound official sources', () => {
  expect(validateTripSnapshot(draft)).toMatchObject({ valid: true })
  const restored = structuredClone(draft)
  for (const note of notes) {
    const item = restored.days.find((d: { id: string }) => d.id === note.day).timeline.find((i: { id: string }) => i.id === note.id)
    const old = before.days.find((d: { id: string }) => d.id === note.day).timeline.find((i: { id: string }) => i.id === note.id)
    expect(item.description).toBe(`${old.description}\n${note.text}`)
    item.description = old.description
    expect(restored.sources.find((s: { id: string }) => s.id === note.sourceId)).toMatchObject({ url: note.url, type: 'official', entity: { type: 'timeline', id: note.id } })
  }
  expect(restored.sources.slice(-2).map((s: { id: string }) => s.id)).toEqual(notes.map(n => n.sourceId))
  restored.sources = restored.sources.slice(0, -2)
  expect(restored).toEqual(before)
  const manifest = JSON.parse(readFileSync('docs/proposals/jp2027-draft-manifest.json', 'utf8'))
  const ledger = JSON.parse(readFileSync('docs/proposals/jp2027-source-review.json', 'utf8'))
  expect(ledger.implementationPacket2.entries.map((e: { approvedNote: string }) => e.approvedNote)).toEqual(notes.map(n => n.text))
  expect(ledger.implementationPacket2.routeGate).toContain('OPEN')
  expect(manifest).toMatchObject({ published: false, isCurrent: false, authorizedForSupabaseWrite: false, proposedDataVersion: 'jp2027.2-DRAFT-UNPUBLISHED' })
  expect(createHash('sha256').update(readFileSync(path)).digest('hex')).toBe(manifest.draftSha256)
  expect(createHash('sha256').update(readFileSync('tests/fixtures/japan2027-schema5.json')).digest('hex')).toBe('09a0bc1a5b75e50b579fd5ec4596912026cf8311fdf262df0c14ca6e235ea57e')
})

for (const font of ['small', 'medium', 'large']) test(`conditional D7/D8 roadside notes wrap with unchanged schedule at ${font} font`, async ({ page }, info) => {
  await page.addInitScript(size => localStorage.setItem('travelpilot.font-size', size), font)
  await seedAuth(page)
  const requests = await mockJapan(page, { versions: [{ ...japanVersion(), schema_version: 6, data_version: 'jp2027.2-DRAFT-UNPUBLISHED', payload: draft }] })
  await page.goto(`#/trip/${draft.trip.slug}/itinerary`)
  await expect(page.getByTestId('trip-versions')).toContainText('Trip Schema Version：6')
  for (const note of notes) {
    const day = page.locator(`details[data-day-id="${note.day}"]`)
    if (await day.getAttribute('open') === null) await day.locator('summary').first().click()
    const row = day.locator(`[data-item-id="${note.id}"]`)
    const text = row.locator('.timeline-event > p').first()
    await expect(text).toContainText(note.text)
    const item = before.days.find((d: { id: string }) => d.id === note.day).timeline.find((i: { id: string }) => i.id === note.id)
    await expect(row.locator('.timeline-time')).toHaveText(`${item.startTime} – ${item.endTime}`)
    await row.scrollIntoViewIfNeeded()
    expect(await text.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    // A whole row is taller than the mobile viewport. Capture the note itself,
    // below sticky controls, rather than silently framing its transport card.
    await text.evaluate(node => {
      const main = document.querySelector('main')!
      const sticky = [...document.querySelectorAll('.page-navigation, .day-jump')]
        .map(n => n.getBoundingClientRect().bottom)
      main.scrollTop += node.getBoundingClientRect().top - Math.max(0, ...sticky) - 12
    })
    await page.screenshot({ path: info.outputPath(`${note.day}-${font}.png`) })
  }
  expect(requests.every(r => r.method === 'GET')).toBe(true)
})
