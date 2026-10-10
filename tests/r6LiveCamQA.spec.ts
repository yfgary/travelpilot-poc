import { test, expect } from './fixtures'
import { mediaSnapshot, roadContent, openContent, seedContentCache } from './contentFixtures'
import { groupLiveCams, secureInlineURL } from '../src/data/liveCams'
import { validateTripSnapshot, type TripSnapshot } from '../src/data/schema/trip'
import { cacheContents } from './tripFixtures'
import type { Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { assertSourceBaseline } from './sourceBaseline'
import baseline from './fixtures/r6-protected-baseline.json' with { type: 'json' }

async function media(page: Page, policy?: 'csp' | 'xfo') {
  const requests: string[] = []
  await page.route('https://media.example.invalid/**', async (route) => {
    requests.push(route.request().url())
    if (route.request().url().endsWith('.svg')) await route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><text x="20" y="100">CONTROLLED TEST IMAGE, NOT A CAMERA</text></svg>' })
    else await route.fulfill({ contentType: 'text/html', headers: policy === 'csp' ? { 'Content-Security-Policy': "frame-ancestors 'none'" } : policy === 'xfo' ? { 'X-Frame-Options': 'DENY' } : {},
      body: '<!doctype html><html><body><p>CONTROLLED TEST FRAME, NOT A LIVESTREAM</p><script>document.body.dataset.script="executed"</script></body></html>' })
  })
  return requests
}
const cards = (page: Page) => page.getByTestId('camera-card')
function embedOnly() { const snapshot = mediaSnapshot(); snapshot.liveCams = [snapshot.liveCams[0]]; return snapshot }

test('R6 a loaded sandboxed frame is not presented as verified playback; fallback and user retry remain available', async ({ page }) => {
  await media(page); await openContent(page, embedOnly(), 'live')
  const card = cards(page); await card.scrollIntoViewIfNeeded()
  await expect(card.frameLocator('iframe').locator('body')).toHaveAttribute('data-script', 'executed')
  await expect(card.getByTestId('camera-frame-status')).toHaveText('框架載入程序已完成；實際畫面及播放狀態仍未確認。')
  await expect(card.locator('iframe')).toHaveAttribute('sandbox', 'allow-scripts allow-presentation')
  await expect(card.locator('iframe')).toHaveAttribute('allow', 'fullscreen')
  await expect(card.locator('iframe')).toHaveAttribute('referrerpolicy', 'no-referrer')
  await expect(card.locator('iframe')).not.toHaveAttribute('src', /autoplay=1/)
  await card.getByRole('button', { name: '畫面未能播放' }).click()
  await expect(card.locator('iframe')).toHaveCount(0)
  await expect(card.getByText('暫時未能載入畫面，請使用下方來源連結。')).toBeVisible()
  await expect(card.getByRole('link', { name: /開啟 Live Cam／官方來源/ })).toBeVisible()
  await card.getByRole('button', { name: '重新嘗試載入' }).click()
  await expect(card.frameLocator('iframe').locator('body')).toHaveAttribute('data-script', 'executed')
})
for (const policy of ['csp', 'xfo'] as const) test(`R6 actual browser ${policy} framing denial never becomes a verified-live claim`, async ({ page }) => {
  const errors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  await media(page, policy); await openContent(page, embedOnly(), 'live')
  const card = cards(page); await card.scrollIntoViewIfNeeded()
  await expect.poll(() => errors.some((message) => /frame-ancestors|X-Frame-Options/i.test(message))).toBe(true)
  await expect(card.frameLocator('iframe').getByText('CONTROLLED TEST FRAME, NOT A LIVESTREAM')).toHaveCount(0)
  await expect(card).toContainText('瀏覽器無法可靠判定跨網站播放器是否可用')
  await expect(card).not.toContainText(/直播正常|播放成功|已驗證直播/)
  await card.getByRole('button', { name: '畫面未能播放' }).click()
  await expect(card.locator('iframe')).toHaveCount(0)
  await expect(card.getByRole('link', { name: /開啟 Live Cam／官方來源/ })).toHaveAttribute('href', 'https://media.example.invalid/embed')
})
test('R6 visible stalled frame gives a truthful unconfirmed state, not a definitive blocked/error diagnosis', async ({ page }) => {
  await page.clock.install()
  let requested = false
  await page.route('https://media.example.invalid/**', async () => { requested = true; await new Promise<void>((resolve) => page.once('close', () => resolve())) })
  await openContent(page, embedOnly(), 'live'); await cards(page).scrollIntoViewIfNeeded()
  await expect.poll(() => requested).toBe(true)
  await expect(cards(page).getByTestId('camera-frame-status')).toContainText('正在載入來源框架')
  await page.clock.fastForward(16000)
  await expect(cards(page).getByTestId('camera-frame-status')).toContainText('未能確認來源載入')
  await expect(cards(page).locator('iframe')).toHaveCount(1)
  await expect(cards(page).getByRole('link', { name: /開啟 Live Cam／官方來源/ })).toBeVisible()
})
test('R6 image/preview load times are device load evidence only with no automatic refresh', async ({ page }) => {
  await page.clock.install()
  const requests = await media(page), snapshot = mediaSnapshot(); snapshot.liveCams = [snapshot.liveCams[1], snapshot.liveCams[2]]
  await openContent(page, snapshot, 'live')
  for (const card of await cards(page).all()) {
    await card.scrollIntoViewIfNeeded(); await expect(card.locator('time')).toHaveAttribute('datetime', /^\d{4}-\d{2}-\d{2}T/)
    await expect(card.locator('time')).toHaveText(/^\d{2}:\d{2}:\d{2}$/)
    await expect(card).toContainText('裝置載入時間不代表拍攝或來源更新時間')
    await expect(card.locator('time')).toHaveCount(1)
  }
  await expect(cards(page).nth(1)).toContainText('此為預覽圖片，不代表即時直播')
  const previous = [...requests]
  await page.clock.fastForward(120000)
  expect(requests).toEqual(previous)
})
test('R6 failed image retry preserves exact URL and safe actions', async ({ page }) => {
  let fail = true
  await page.route('https://media.example.invalid/**', async (route) => fail ? route.abort() : route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"/>'}))
  const snapshot = mediaSnapshot(); snapshot.liveCams = [snapshot.liveCams[1]]
  await openContent(page, snapshot, 'live'); await cards(page).scrollIntoViewIfNeeded()
  await expect(cards(page).getByText('暫時未能載入畫面，請使用下方來源連結。')).toBeVisible()
  fail = false; await cards(page).getByRole('button', { name: '重新嘗試載入' }).click()
  await expect(cards(page).getByRole('img')).toHaveAttribute('src', snapshot.liveCams[0].sourceURL)
  await expect(cards(page).locator('time')).toHaveCount(1)
})
test('R6 same source records merge losslessly across days/regions/groups while different capability/query/preview remain distinct', async ({ page }) => {
  const snapshot = structuredClone(roadContent), original = snapshot.liveCams[0]
  const alias = { ...original, id: 'r6-alias', label: '同來源另一日關聯', regionId: snapshot.regions[0].id, placeId: undefined, routeDayIds: [snapshot.days[0].id], group: '另一資料群組', tags:['另一標籤'], priority:'backup' as const, officialURL:'https://media.example.invalid/alias-official' }
  snapshot.liveCams = [original, alias]
  const before = structuredClone(snapshot), groups = groupLiveCams(snapshot)
  expect(groups.flatMap(g=>g.cameras)).toHaveLength(1)
  expect(groups[0].cameras[0].days.map(d=>d.id)).toEqual(snapshot.days.slice(0,3).map(d=>d.id))
  expect(groups[0].cameras[0].tags).toContain('另一標籤')
  expect(snapshot).toEqual(before)
  await openContent(page, snapshot, 'live'); await expect(cards(page)).toHaveCount(1)
  await expect(cards(page)).toContainText(alias.label); await expect(cards(page)).toContainText(alias.group)
  await expect(cards(page)).toContainText((snapshot.regions[0].label ?? snapshot.regions[0].name)!); await expect(cards(page)).toContainText('Backup')
  await expect(cards(page).getByRole('link', { name: `官方來源：${alias.label}`, exact:true })).toHaveAttribute('href',alias.officialURL)
  const nav = page.getByRole('navigation', { name: 'Live Cam 行程日期' })
  for (const day of snapshot.days.slice(0,3)) { await nav.getByRole('button', {name:`D${day.dayNumber}`,exact:true}).click(); await expect(cards(page)).toHaveCount(1); for(const n of [1,2,3])await expect(cards(page).locator('.camera-badges')).toContainText(`D${n}`) }
  const distinct = mediaSnapshot(); distinct.liveCams = [distinct.liveCams[0], {...distinct.liveCams[0],id:'query',sourceURL:distinct.liveCams[0].sourceURL+'?angle=other'}, distinct.liveCams[2], {...distinct.liveCams[2],id:'preview2',previewURL:'https://media.example.invalid/other.svg'}]
  expect(groupLiveCams(distinct).flatMap(g=>g.cameras)).toHaveLength(4)
})
for (const version of [5,6] as const) test(`R6 physical Schema ${version} cache uses shared camera presentation offline without rewriting`, async ({ page }) => {
  const snapshot = {...structuredClone(roadContent),schemaVersion:version,trip:{...roadContent.trip,id:`r6-cache-trip-${version}`,slug:`r6-cache-schema-${version}`}} as TripSnapshot
  expect(validateTripSnapshot(snapshot).valid).toBe(true)
  await seedContentCache(page,snapshot);const before=await cacheContents(page)
  await page.addInitScript(()=>{localStorage.clear();Object.defineProperty(navigator,'onLine',{get:()=>false,configurable:true})})
  await page.reload()
  await page.goto(`#/trip/${snapshot.trip.slug}/live`);await expect(cards(page)).toHaveCount(snapshot.liveCams.length)
  await expect(cards(page).first()).toContainText('目前離線');await expect(cards(page).locator('iframe,img')).toHaveCount(0)
  await expect(page.getByTestId('trip-versions')).toContainText(`Trip Schema Version：${version}`)
  await page.reload();await expect(cards(page)).toHaveCount(snapshot.liveCams.length);expect(await cacheContents(page)).toEqual(before)
})
for (const size of ['small','medium','large']) test(`R6 ${size} media controls and source actions fit all widths and are keyboard/touch usable`, async ({page},testInfo)=>{
  await page.addInitScript(s=>localStorage.setItem('travelpilot.font-size',s),size)
  await media(page);const snapshot=mediaSnapshot();snapshot.liveCams=snapshot.liveCams.slice(0,3)
  await openContent(page,snapshot,'live')
  for(const card of await cards(page).all()){await card.scrollIntoViewIfNeeded();for(const button of await card.getByRole('button').all())expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44)}
  const first=cards(page).first();await first.scrollIntoViewIfNeeded();await first.getByRole('button',{name:'畫面未能播放'}).focus()
  expect(await first.getByRole('button',{name:'畫面未能播放'}).evaluate(n=>getComputedStyle(n).outlineStyle)).not.toBe('none')
  await page.keyboard.press('Enter');await expect(first.locator('iframe')).toHaveCount(0)
  await first.getByRole('button',{name:'重新嘗試載入'}).click();await expect(first.frameLocator('iframe').locator('body')).toHaveAttribute('data-script','executed')
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(await page.locator('main').evaluate(n=>n.scrollWidth<=n.clientWidth)).toBe(true)
  await page.screenshot({path:`work/r6-${testInfo.project.name}-${size}.png`})
})
test('R6 security and immutable-source audit preserve all pre-R6 runtime boundaries and published snapshot',()=>{
  for(const url of ['http://example.invalid/a','javascript:alert(1)','https://user:password@example.invalid/a','data:text/html,unsafe'])expect(secureInlineURL(url)).toBeUndefined()
  expect(createHash('sha256').update(readFileSync('tests/fixtures/japan2027-schema5.json')).digest('hex')).toBe('09a0bc1a5b75e50b579fd5ec4596912026cf8311fdf262df0c14ca6e235ea57e')
  assertSourceBaseline(['src/data/schema','src/data/demoTrips','src/data/trips.ts','src/services','src/offline','src/auth','supabase','assets','.github/workflows'], baseline.hashes)
  const runtime=['src/data/liveCams.ts','src/views/LiveCam.tsx','src/components/liveCam/CameraCard.tsx'].map(p=>readFileSync(p,'utf8')).join('\n')
  expect(runtime).not.toMatch(/Japan|Shirakawa|shinhotaka|jp2027|hydrate|youtube|allow-same-origin|autoplay=1|service_role|sb_secret/i)
})
