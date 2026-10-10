import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { test, expect } from './fixtures'
import { todayFixture, openToday } from './todayFixtures'
import { legacyRoad } from './legacySnapshots'
import schema2 from './fixtures/schema2-road.json' with { type: 'json' }
import schema3 from './fixtures/schema3-road.json' with { type: 'json' }
import { roadContent } from './contentFixtures'
import { japan, japanBytes, mockJapan } from './japanFixtures'
import { cacheContents, remoteSlug, seedAuth } from './tripFixtures'
import { validateTripSnapshot, type TripSnapshot } from '../src/data/schema/trip'
import metadata from '../package.json' with { type: 'json' }

const paragraphs = ['虛構測試：出發前完成報到及行李安排，保留轉乘緩衝。', '虛構測試：先在安全休息區停車，再由乘客確認後續路線。', '<script>不可執行的原文</script> & 完整結尾。']
const description = paragraphs.join('\n\n')
const row = (page: import('@playwright/test').Page, id: string) => page.locator(`.today-activities li[data-item-id="${id}"]`)

for (const font of ['small', 'medium', 'large']) test(`Today full list preserves authored instructions outside focus and wraps at ${font} font`, async ({ page }, info) => {
  await page.addInitScript((font) => localStorage.setItem('travelpilot.font-size', font), font)
  const payload = todayFixture()
  payload.days[0].timeline[0].description = description
  payload.days[0].timeline[4].description = '虛構測試：抵達後先辦理入住，再休息。'
  const snapshot = await openToday(page, payload)
  const first = row(page, snapshot.days[0].timeline[0].id), last = row(page, snapshot.days[0].timeline[4].id)
  // Both records are outside current focus; assert their full-list rows directly.
  await expect(page.locator('.today-current')).not.toContainText(paragraphs[0])
  await expect(first.locator('.place-rich-text p')).toHaveText(paragraphs)
  await expect(last).toContainText(snapshot.days[0].timeline[4].description!)
  await expect(first.locator('script')).toHaveCount(0)
  await first.scrollIntoViewIfNeeded()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  const bounds = await first.boundingBox(); expect(bounds!.x).toBeGreaterThanOrEqual(0); expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(page.viewportSize()!.width)
  await expect(page.getByRole('status')).toBeVisible()
  await page.screenshot({ path: info.outputPath(`today-instructions-${font}.png`) })
  await page.getByRole('button', { name: '已到達／下一項 →', exact: true }).click()
  await expect(page.getByTestId('today-mode')).toHaveAttribute('data-progress-mode', 'manual')
  await expect(first.locator('.place-rich-text p')).toHaveText(paragraphs)
  await page.getByRole('button', { name: '按時間自動', exact: true }).click()
  await expect(page.getByTestId('today-mode')).toHaveAttribute('data-progress-mode', 'auto')
})

for (const version of [1, 2, 3, 4, 5, 6]) test(`Schema ${version} authored Today description remains readable without changing its contract`, async ({ page }) => {
  const source = version === 1 ? legacyRoad : version === 2 ? schema2 : version === 3 ? schema3 : { ...roadContent, schemaVersion: version }
  const snapshot = structuredClone(source) as TripSnapshot
  snapshot.days[0].timeline[0].description = description
  expect(validateTripSnapshot(snapshot)).toMatchObject({ valid: true })
  const loaded = await openToday(page, snapshot, '2026-10-09T06:00:00Z')
  await expect(row(page, loaded.days[0].timeline[0].id).locator('.place-rich-text p')).toHaveText(paragraphs)
  await expect(page.getByTestId('trip-versions')).toContainText(`Trip Schema Version：${version}`)
  const before = await cacheContents(page)
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await expect(page.getByTestId('trip-source')).toContainText('cache')
  await expect(row(page, loaded.days[0].timeline[0].id).locator('.place-rich-text p')).toHaveText(paragraphs)
  expect(await cacheContents(page)).toEqual(before)
})

test('missing descriptions add no empty prose, guessed instruction or placeholder', async ({ page }) => {
  const snapshot = todayFixture()
  for (const item of snapshot.days[0].timeline) delete item.description
  const loaded = await openToday(page, snapshot)
  await expect(page.locator('.today-activities .place-rich-text')).toHaveCount(0)
  await expect(page.locator('.today-activities li h3')).toHaveText(loaded.days[0].timeline.map((item) => item.title))
  await expect(row(page, 'today-optional')).toContainText('虛構可選活動注意事項')
  await expect(row(page, 'today-required').getByRole('link')).toHaveAttribute('href', /google\.com\/maps/)
})

test('immutable Japan authored airport/transfer details are visible; highlights and Bonus are not rewritten', async ({ page }) => {
  await seedAuth(page); await mockJapan(page)
  await page.goto(`#/trip/${japan.trip.slug}/today`)
  await expect(page.getByTestId('today-mode')).toBeVisible()
  for (const item of japan.days[0].timeline.filter((item) => item.description)) await expect(row(page, item.id).locator('.place-rich-text')).toContainText(item.description!)
  await expect(page.locator('.today-highlights li')).toHaveText(japan.days[0].highlights.map((text) => `✦ ${text}`))
  await expect(page.locator('.today-activities')).not.toContainText('繩手通')
  const before = await cacheContents(page)
  await page.getByRole('navigation', { name: '今日模式行程日期' }).getByRole('button', { name: 'D9', exact: true }).click()
  for (const item of japan.days[8].timeline.filter((item) => item.description)) await expect(row(page, item.id).locator('.place-rich-text')).toContainText(item.description!)
  expect(await cacheContents(page)).toEqual(before)
})

for (const font of ['small', 'medium', 'large']) test(`generic itinerary/drive/Bonus/detail content remains complete at ${font} font`, async ({ page }, info) => {
  await page.addInitScript((font) => localStorage.setItem('travelpilot.font-size', font), font)
  const snapshot = todayFixture(), day = snapshot.days[0], place = snapshot.places[0]
  day.timeline[0].description = description
  snapshot.transport[0].notes = ['虛構測試休息站資料；不是實際道路建議。', '由乘客核對路線，安全停車後才操作。']
  place.longDescription = description; place.whyVisit = description; place.history = description; place.localImportance = description; place.takeaway = description
  day.optionalContent = [{ type: 'place', id: place.id }]
  await openToday(page, snapshot)
  await page.goto(`#/trip/${remoteSlug}/itinerary`)
  const section = page.locator(`details[data-day-id="${day.id}"]`)
  await expect(section).toBeVisible()
  if (await section.getAttribute('open') === null) await section.locator('summary').first().click()
  await expect(section).toContainText(paragraphs[0])
  await expect(section).toContainText(snapshot.transport[0].notes[0])
  await expect(section.locator('.day-gallery img')).toHaveCount(day.imageIds.length)
  const bonus = section.locator('details.optionalContent')
  await expect(bonus.locator('summary')).toHaveText('可選／Bonus')
  await bonus.locator('summary').click()
  await bonus.scrollIntoViewIfNeeded()
  await page.screenshot({ path: info.outputPath(`itinerary-bonus-${font}.png`) })
  await page.goto(`#/trip/${remoteSlug}/attractions`)
  const button = page.getByRole('button', { name: `詳細介紹：${place.name}`, exact: true })
  await button.click()
  const dialog = page.getByRole('dialog')
  for (const title of ['景點介紹', '為何值得到訪', '歷史／背景', '在地重要性', '到訪後的收穫']) {
    const block = dialog.getByRole('heading', { name: title, exact: true }).locator('..')
    await expect(block.locator('.place-rich-text').last().locator('p')).toHaveText(paragraphs)
  }
  await expect(dialog.locator('script')).toHaveCount(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  const bounds = await dialog.boundingBox(); expect(bounds!.x).toBeGreaterThanOrEqual(0); expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(page.viewportSize()!.width)
  await page.screenshot({ path: info.outputPath(`attraction-paragraphs-${font}.png`) })
  await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0); await expect(button).toBeFocused()
})

test('R7 pins canonical Japan and confines the runtime patch to shared authored-text presentation', () => {
  expect(metadata.version).toBe('2.0.0-poc.43')
  expect(createHash('sha256').update(japanBytes).digest('hex')).toBe('09a0bc1a5b75e50b579fd5ec4596912026cf8311fdf262df0c14ca6e235ea57e')
  const source = readFileSync('src/views/TodayMode.tsx', 'utf8')
  expect(source).toContain('item.description && <RichText value={item.description} />')
  expect(source).not.toMatch(/jp27|jp2027|繩手|松本|Japan|Nagoya|UO680|UO685|dayNumber\s*===|trip\.slug\s*===/)
})
