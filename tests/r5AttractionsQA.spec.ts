import { test, expect } from './fixtures'
import { roadContent, openContent } from './contentFixtures'
import { derivePlaceUsage } from '../src/data/attractions'
import { splitRichParagraphs } from '../src/data/richText'

test('R5 retains every authored paragraph without shortening or inventing missing prose', async ({ page }) => {
  const snapshot = structuredClone(roadContent)
  const place = snapshot.places[0]
  place.summary = '虛構中文總覽'
  place.longDescription = '完整介紹第一段。\n\n完整介紹第二段。\n\n完整介紹第三段。'
  place.whyVisit = '理由第一段。\n\n理由第二段。'
  place.history = '歷史第一段。\n\n歷史第二段。'
  place.localImportance = '在地第一段。\n\n在地第二段。'
  place.takeaway = '收穫第一段。\n\n收穫第二段。'
  place.whatToSee = ['留意入口標示', '留意安全資訊']
  expect(splitRichParagraphs(place.longDescription)).toHaveLength(3)
  await openContent(page, snapshot, 'attractions')
  await page.getByRole('button', { name: `詳細介紹：${place.name}` }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByTestId('place-detail-introduction').locator('.place-rich-text p')).toHaveText([
    '虛構中文總覽', '完整介紹第一段。', '完整介紹第二段。', '完整介紹第三段。',
  ])
  for (const label of ['為何值得到訪', '歷史／背景', '在地重要性', '到訪後的收穫']) {
    const section = dialog.locator('.place-detail-section').filter({ has: dialog.getByRole('heading', { name: label }) })
    await expect(section.locator('.place-rich-text p')).toHaveCount(2)
  }
  await expect(dialog).toContainText('留意入口標示')
  await expect(dialog).toContainText('留意安全資訊')
})

test('R5 day filter intersects status on the same day; region groups derive from filtered places', async ({ page }) => {
  const snapshot = structuredClone(roadContent)
  const place = snapshot.places[0]
  snapshot.days[1].optionalContent.push({ type: 'place', id: place.id })
  snapshot.days[2].backupContent.push({ type: 'place', id: place.id })
  await openContent(page, snapshot, 'attractions')
  const use = derivePlaceUsage(snapshot)
  const day2 = snapshot.days[1], day3 = snapshot.days[2]
  const dayNav = page.getByRole('navigation', { name: '景點日期' })
  await expect(dayNav.getByRole('button').first()).toHaveText('全部日子')
  const day2Button = dayNav.getByRole('button', { name: `D${day2.dayNumber} · ${day2.title}` })
  await day2Button.click()
  await expect(day2Button).toHaveAttribute('aria-pressed', 'true')
  const matchingDay2 = use.filter((entry) => entry.occurrences.some((item) => item.day.id === day2.id))
  await expect(page.getByTestId('attraction-card')).toHaveCount(matchingDay2.length)
  await page.getByRole('button', { name: /備用 \d+/ }).click()
  const matchingBackupOnDay2 = use.filter((entry) => entry.occurrences.some((item) => item.day.id === day2.id && item.status === 'backup'))
  await expect(page.getByTestId('attraction-card')).toHaveCount(matchingBackupOnDay2.length)
  await expect(page.getByRole('navigation', { name: '景點地區' })).toHaveCount(matchingBackupOnDay2.length ? 1 : 0)
  const day3Button = dayNav.getByRole('button', { name: `D${day3.dayNumber} · ${day3.title}` })
  await day3Button.click()
  const matchingBackupOnDay3 = use.filter((entry) => entry.occurrences.some((item) => item.day.id === day3.id && item.status === 'backup'))
  await expect(page.getByTestId('attraction-card')).toHaveCount(matchingBackupOnDay3.length)
  await dayNav.getByRole('button', { name: '全部日子' }).click()
  await page.getByRole('button', { name: /全部 \d+/ }).first().click()
  await expect(page.getByTestId('attraction-card')).toHaveCount(use.length)
})

test('R5 day and region selectors remain sticky below shared trip navigation at every width', async ({ page }) => {
  const snapshot = structuredClone(roadContent)
  for (let i = 0; i < 8; i++) {
    const id = `r5-extra-place-${i}`
    snapshot.places.push({ ...snapshot.places[0], id, name: `虛構追加場所${i}`, summary: '景點示範介紹'.repeat(18), imageIds: [] })
    snapshot.days[1].timeline.push({ id: `r5-extra-timeline-${i}`, type: 'activity', title: `示範景點${i}`, optional: false, placeId: id })
  }
  await openContent(page, snapshot, 'attractions')
  const selectors = page.getByTestId('attraction-sticky-selectors')
  await expect(selectors.getByRole('navigation', { name: '景點日期' })).toBeVisible()
  await expect(selectors.getByRole('navigation', { name: '景點地區' })).toBeVisible()
  await page.locator('main').evaluate((node) => { node.scrollTop += 420 })
  const nav = (await selectors.boundingBox())!, tripNav = (await page.getByRole('navigation', { name: '旅程頁面' }).boundingBox())!
  expect(nav.y).toBeGreaterThanOrEqual(tripNav.y + tripNav.height - 3)
  expect(nav.y).toBeLessThanOrEqual(tripNav.y + tripNav.height + 9)
  const region = selectors.getByRole('navigation', { name: '景點地區' }).getByRole('button').last()
  await region.click()
  const id = await region.getAttribute('aria-controls')
  await expect(page.locator(`#${id}`)).toBeFocused()
  const heading = (await page.locator(`#${id}`).boundingBox())!, after = (await selectors.boundingBox())!
  expect(heading.y).toBeGreaterThanOrEqual(after.y + after.height - 4)
  expect(await page.locator('main').evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true)
})
