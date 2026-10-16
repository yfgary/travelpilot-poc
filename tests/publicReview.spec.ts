import { test as normalTest, expect, supabaseOrigin } from './fixtures'
import type { Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import descriptor from '../preview/inputs.json' with { type: 'json' }
import { selectTodayDay, isOperationalDay } from '../src/data/today'
import type { TripSnapshot } from '../src/data/schema/trip'
import { cityTrip } from '../src/data/demoTrips/cityTrip'
import { orderedDefinitions } from '../src/data/tripInformation'
import { observePreviewChecklist } from './previewChecklistDiagnostics'

const origin = 'http://127.0.0.1:4173', normal = `${origin}/travelpilot-poc/`, review = `${normal}review/`
const snapshot = JSON.parse(readFileSync(descriptor.file, 'utf8')) as TripSnapshot
const test = normalTest.extend<{ reviewNetwork: void }>({
  reviewNetwork: [async ({ page }, use, testInfo) => {
    const unexpected: string[] = [], errors: string[] = []
    const reviewing = () => page.url().startsWith(review)
    page.on('pageerror', error => { if (reviewing()) errors.push(error.message) })
    page.on('response', response => { if (response.url().startsWith(review) && response.status() >= 400) errors.push(`HTTP ${response.status()}`) })
    await page.route('**/*', route => {
      const request = route.request(), url = request.url()
      if (request.isNavigationRequest() && url.startsWith(normal)) return route.fallback()
      if (!reviewing() && !url.startsWith(review)) return route.fallback()
      if (url.startsWith(review)) return route.continue()
      unexpected.push(new URL(url).origin); return route.abort('blockedbyclient')
    })
    const diagnose = process.env.TRAVELPILOT_PREVIEW_DURABILITY_DIAGNOSTICS === '1' && testInfo.title === 'same-origin Checklist Reset and normal Clear preserve the other app data'
      ? await observePreviewChecklist(page, testInfo, { site: 'review-demo', tripId: cityTrip.trip.id, itemId: orderedDefinitions(orderedDefinitions(orderedDefinitions(cityTrip.checklists)[0].groups)[0].items)[0].id })
      : null
    try { await use() } finally {
      await diagnose?.()
      expect(unexpected, 'Review must load only its own static root; zero live/normal backend requests').toEqual([]); expect(errors).toEqual([])
    }
  }, { auto: true }],
})
async function open(page: Page, route = '/') {
  await page.goto(`${review}#${route}`)
  await expect(page.getByTestId('preview-notice')).toBeVisible()
}
async function info(page: Page, slug = descriptor.slug) {
  await open(page, `/trip/${slug}/info`)
  await expect(page.getByTestId('trip-information')).toBeVisible()
  await page.getByRole('button', { name: 'Checklist', exact: true }).click()
}
const views = [['home', ''], ['settings', ''], ['itinerary', 'detailed-itinerary'], ['info', 'trip-information'], ['attractions', 'attractions-overview'], ['live', 'live-cam'], ['today', 'today-mode']] as const
for (const font of ['small', 'medium', 'large']) for (const [view, id] of views) test(`same-origin ${font} review ${view}: direct reload, scoped assets and usable layout`, async ({ page }, testInfo) => {
  await page.addInitScript(font => { localStorage.setItem('travelpilot-preview.font-size', font); localStorage.setItem('travelpilot.font-size', font) }, font)
  if (view === 'home') {
    await page.goto(normal)
    await expect(page.locator('.trip-card')).toHaveCount(2)
    const entry = page.getByRole('link', { name: '日本 2027（未發佈草稿 Preview）', exact: true })
    await expect(entry).toHaveAttribute('href', '/travelpilot-poc/review/#/')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await entry.click()
  } else await open(page, view === 'settings' ? '/settings' : `/trip/${descriptor.slug}/${view}`)
  await expect(page.getByTestId('preview-notice')).toContainText('SIMULATED')
  const ready = () => id ? expect(page.getByTestId(id)).toBeVisible() : expect(page.getByRole('heading', { name: view === 'home' ? '每一段旅程，都準備妥當。' : '設定', exact: true })).toBeVisible()
  await ready(); await page.reload(); await ready()
  await expect(page.locator('html')).toHaveAttribute('data-font-size', font)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await expect(page.locator('.app-status')).toBeVisible()
  if (id) {
    await expect(page.getByTestId('trip-versions')).toContainText(descriptor.dataVersion)
    await expect(page.getByTestId('trip-source')).toContainText('preview')
  }
  for (const image of await page.locator('img').all()) {
    await image.scrollIntoViewIfNeeded()
    await expect.poll(() => image.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true)
  }
  if (font === 'medium' && view === 'home' && ['width-390', 'width-1440'].includes(testInfo.project.name) || font === 'large' && testInfo.project.name === 'width-320' && ['home', 'today'].includes(view)) {
    await page.locator('main').evaluate(node => { node.scrollTop = 0 })
    await page.screenshot({ path: testInfo.outputPath(`public-review-${view}-${font}.png`) })
  }
})

test('same-origin release smoke: POC entry, validated draft, assets, manifest and disabled services', async ({ page }) => {
  await page.goto(normal)
  await page.getByRole('link', { name: '日本 2027（未發佈草稿 Preview）', exact: true }).click()
  await expect(page.locator('.trip-card')).toHaveCount(3)
  await expect(page.getByRole('link', { name: '日本 2027（未發佈草稿 Preview）', exact: true })).toHaveCount(0)
  await open(page, `/trip/${descriptor.slug}/itinerary`)
  await expect(page.getByTestId('trip-versions')).toContainText('Trip Schema Version：6')
  await expect(page.getByTestId('trip-versions')).toContainText(descriptor.dataVersion)
  await page.reload(); await expect(page.getByTestId('detailed-itinerary')).toBeVisible()
  await open(page, '/settings')
  await expect(page.getByRole('textbox')).toHaveCount(0)
  await expect(page.getByRole('button', { name: /登入|登出|同步|更新/ })).toHaveCount(0)
  const manifestURL = await page.locator('link[rel="manifest"]').getAttribute('href')
  expect(manifestURL).toBe('/travelpilot-poc/review/manifest.webmanifest')
  const manifest = await (await page.request.get(`${origin}${manifestURL}`)).json()
  expect(new URL(manifest.start_url, `${origin}${manifestURL}`).href).toBe(`${review}#/`)
  expect(new URL(manifest.scope, `${origin}${manifestURL}`).href).toBe(review)
})

test('same-origin preferences, Today/history, DB/cache sentinels and BroadcastChannel stay isolated', async ({ page, context }) => {
  await page.goto(`${normal}assets/images/travelpilot_icon.PNG`)
  const now = new Date(), canonical = selectTodayDay(snapshot, now)!, other = snapshot.days.find(day => day.id !== canonical.id && !isOperationalDay(snapshot, day, now))!
  const normalLocal = { 'travelpilot.font-size': 'large', 'travelpilot.recent-trip': descriptor.slug, [`travelpilot.weather-region.${snapshot.trip.id}`]: snapshot.weather.weatherRegions.at(-1)!.id, 'travelpilot.auto-check-updates': 'true', 'sb-synthetic-normal-auth-token': 'synthetic-not-a-real-session', 'production-fixture-sentinel': 'unchanged' }
  const normalSession = { 'travelpilot.navigation-history': 'normal-sentinel', [`travelpilot.today.preview.${encodeURIComponent(snapshot.trip.id)}`]: other.id, [`travelpilot.today.progress.${JSON.stringify([snapshot.trip.id, other.id])}`]: other.timeline.at(-1)!.id }
  await page.evaluate(async ({ local, session }) => {
    for (const [key, value] of Object.entries(local)) localStorage.setItem(key, value)
    for (const [key, value] of Object.entries(session)) sessionStorage.setItem(key, value)
    for (const name of ['travelpilot-v2-trips', 'travelpilot-v2-user-state', 'travelpilot-v2-weather-cache']) await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(name, 1); request.onupgradeneeded = () => request.result.createObjectStore('sentinel')
      request.onerror = () => reject(request.error); request.onsuccess = () => { const db = request.result, tx = db.transaction('sentinel', 'readwrite'); tx.objectStore('sentinel').put('normal-data', 'key'); tx.oncomplete = () => { db.close(); resolve() }; tx.onabort = () => reject(tx.error) }
    })
    const cache = await caches.open('normal-fixture-cache'); await cache.put('/normal-fixture', new Response('normal-cache'))
  }, { local: normalLocal, session: normalSession })
  const watcher = await context.newPage()
  try {
    await watcher.goto(`${normal}assets/images/travelpilot_icon.PNG`)
    await watcher.evaluate(() => { const channel = new BroadcastChannel('travelpilot.checklist-state'); Object.assign(window, { normalChannel: channel, normalMessages: [] }); channel.onmessage = event => (window as any).normalMessages.push(event.data) })
    await page.addInitScript(() => {
      if (!location.pathname.startsWith('/travelpilot-poc/review/')) return
      const audit = { keys: [] as string[], databases: [] as string[], channels: [] as string[], forbidden: [] as string[] }; (window as any).reviewAudit = audit
      for (const operation of ['getItem', 'setItem', 'removeItem'] as const) {
        const native = Storage.prototype[operation]; (Storage.prototype[operation] as any) = function (this: Storage, ...args: any[]) { audit.keys.push(String(args[0])); return (native as Function).apply(this, args) }
      }
      const clear = Storage.prototype.clear; Storage.prototype.clear = function () { audit.forbidden.push('Storage.clear'); return clear.call(this) }
      const open = IDBFactory.prototype.open; IDBFactory.prototype.open = function (...args) { audit.databases.push(args[0]); return open.apply(this, args) }
      const NativeChannel = BroadcastChannel; window.BroadcastChannel = class extends NativeChannel { constructor(name: string) { audit.channels.push(name); super(name) } }
      for (const method of ['open', 'delete', 'keys', 'match'] as const) {
        const native = CacheStorage.prototype[method]; (CacheStorage.prototype[method] as any) = function (this: CacheStorage, ...args: any[]) { audit.forbidden.push(`CacheStorage.${method}`); return (native as Function).apply(this, args) }
      }
      const register = ServiceWorkerContainer.prototype.register; ServiceWorkerContainer.prototype.register = function (...args) { audit.forbidden.push('serviceWorker.register'); return register.apply(this, args) }
    })
    await open(page)
    await expect(page.locator('html')).toHaveAttribute('data-font-size', 'medium')
    await expect(page.locator('.badge-recent')).toHaveCount(0)
    await page.locator('.trip-card').filter({ has: page.getByRole('heading', { name: snapshot.trip.title, exact: true }) }).getByRole('link', { name: `開啟 ${snapshot.trip.title}`, exact: true }).click()
    const region = snapshot.weather.weatherRegions.at(-1)!
    await page.getByRole('group', { name: '天氣地區', exact: true }).getByRole('button', { name: region.label, exact: true }).click()
    await page.getByRole('link', { name: '今日模式', exact: true }).click()
    await expect(page.getByTestId('today-mode')).toHaveAttribute('data-selected-day', canonical.id)
    await page.getByRole('navigation', { name: '今日模式行程日期' }).getByRole('button', { name: `D${other.dayNumber}`, exact: true }).click()
    await page.getByRole('button', { name: '已到達／下一項 →', exact: true }).click()
    await page.getByRole('link', { name: '設定', exact: true }).click()
    await page.getByRole('radio', { name: '小', exact: true }).check()
    const beforeReload = await page.evaluate(() => (window as any).reviewAudit)
    await page.reload(); await expect(page.getByRole('radio', { name: '小', exact: true })).toBeChecked()
    await page.getByRole('button', { name: '返回上一頁' }).click()
    await expect(page).toHaveURL(`${review}#/trip/${descriptor.slug}/today`)
    const afterReload = await page.evaluate(() => (window as any).reviewAudit)
    const audit = Object.fromEntries(Object.keys(beforeReload).map(key => [key, [...beforeReload[key], ...afterReload[key]]]))
    expect(audit.keys.length).toBeGreaterThan(0); expect(audit.keys.every((key: string) => key.startsWith('travelpilot-preview.'))).toBe(true)
    expect(audit.databases.length).toBeGreaterThan(0); expect(audit.databases.every((name: string) => name.startsWith('travelpilot-preview-'))).toBe(true)
    expect(audit.channels).toContain('travelpilot-preview.checklist-state'); expect(audit.channels).not.toContain('travelpilot.checklist-state'); expect(audit.forbidden).toEqual([])
    expect(await watcher.evaluate(() => (window as any).normalMessages)).toEqual([])
    expect(await page.evaluate(keys => Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), Object.keys(normalLocal))).toEqual(normalLocal)
    expect(await page.evaluate(keys => Object.fromEntries(keys.map(key => [key, sessionStorage.getItem(key)])), Object.keys(normalSession))).toEqual(normalSession)
    expect(await page.evaluate(() => localStorage.getItem('travelpilot-preview.recent-trip'))).toBe(descriptor.slug)
    expect(await page.evaluate(key => sessionStorage.getItem(key), `travelpilot-preview.today.preview.${encodeURIComponent(snapshot.trip.id)}`)).toBe(other.id)
    expect(await page.evaluate(key => sessionStorage.getItem(key), `travelpilot-preview.today.progress.${JSON.stringify([snapshot.trip.id, other.id])}`)).not.toBeNull()
    expect(await watcher.evaluate(async () => (await caches.match('/normal-fixture'))?.text())).toBe('normal-cache')
    for (const name of ['travelpilot-v2-trips', 'travelpilot-v2-user-state', 'travelpilot-v2-weather-cache']) expect(await watcher.evaluate(name => new Promise((resolve, reject) => { const r = indexedDB.open(name); r.onerror = () => reject(r.error); r.onsuccess = () => { const db = r.result, tx = db.transaction('sentinel'), get = tx.objectStore('sentinel').get('key'); get.onsuccess = () => resolve(get.result); tx.oncomplete = () => db.close() } }), name)).toBe('normal-data')
  } finally { await watcher.close() }
})

test('same-origin Checklist Reset and normal Clear preserve the other app data', async ({ page, context }) => {
  await info(page, 'demo-trip'); await page.getByRole('checkbox').first().check()
  await page.reload(); await expect(page.getByRole('checkbox').first()).toBeChecked()
  const normalPage = await context.newPage()
  try {
    await normalPage.route(`${supabaseOrigin}/**`, route => route.fulfill({ status: 200, json: [] }))
    await normalPage.goto(`${normal}#/trip/demo-trip/info`)
    await normalPage.getByRole('button', { name: 'Checklist', exact: true }).click()
    await normalPage.getByRole('checkbox').first().check()
    await expect(normalPage.getByRole('checkbox').first()).toBeChecked()
    await page.getByRole('button', { name: 'Checklist', exact: true }).click()
    page.once('dialog', dialog => dialog.accept()); await page.getByRole('button', { name: /^全部取消勾選：/ }).first().click()
    await expect(page.getByRole('checkbox').first()).not.toBeChecked()
    await normalPage.reload(); await expect(normalPage.getByRole('checkbox').first()).toBeChecked()
    await page.getByRole('checkbox').first().check(); await page.reload(); await expect(page.getByRole('checkbox').first()).toBeChecked()
    await normalPage.getByRole('link', { name: '設定', exact: true }).click()
    normalPage.once('dialog', dialog => dialog.accept()); await normalPage.getByRole('button', { name: '清除本機離線資料', exact: true }).click()
    await expect(normalPage.getByText('本機離線資料已清除。', { exact: true })).toBeVisible()
    await page.reload(); await expect(page.getByRole('checkbox').first()).toBeChecked()
  } finally { await normalPage.close() }
})

test('Pages package contains both complete apps and protects normal data/runtime boundaries', () => {
  expect(execFileSync('node', ['preview/build/packagePages.mjs', '--verify'], { encoding: 'utf8' })).toContain('Pages artifact verified')
  const workflows = readFileSync('.github/workflows/pages.yml', 'utf8')
  expect(workflows).toContain("github.ref == 'refs/heads/main'")
  expect(workflows).toContain("github.repository == 'yfgary/travelpilot-poc'")
  expect(workflows).toContain('npm run build:pages'); expect(workflows).toContain('npm run verify:pages')
  expect(workflows).toContain('Dedicated same-origin review smoke'); expect(workflows).toContain('Require reviewed release version bump')
})
