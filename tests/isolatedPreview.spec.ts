import { test as base, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import descriptor from '../preview/inputs.json' with { type: 'json' }
import baseline from '../preview/normal-baseline.json' with { type: 'json' }
import { readPreviewInput } from '../preview/build/inputs'
import { validatePreviewInput } from '../preview/validation'
import { assertSourceBaseline } from './sourceBaseline'
import { pages } from '../src/app/pages'
import { isOperationalDay, selectTodayDay } from '../src/data/today'
import type { TripSnapshot } from '../src/data/schema/trip'
import { orderedDefinitions } from '../src/data/tripInformation'
import { observePreviewChecklist } from './previewChecklistDiagnostics'

const origin = 'http://127.0.0.1:4174'
const site = `${origin}/travelpilot-poc/`
const snapshot = JSON.parse(readFileSync(descriptor.file, 'utf8'))
// Raw Playwright: do NOT inherit the ordinary Supabase/network mock.
const test = base.extend<{ isolatedNetwork: void }>({
  isolatedNetwork: [async ({ page }, use, info) => {
    const external: string[] = [], errors: string[] = [], blocked: string[] = []
    page.on('request', request => { if (new URL(request.url()).origin !== origin) external.push(new URL(request.url()).origin) })
    page.on('pageerror', error => errors.push(error.message))
    await page.addInitScript(() => {
      window.addEventListener('securitypolicyviolation', event => {
        document.documentElement.dataset.previewBlocked = (document.documentElement.dataset.previewBlocked ?? '') + event.blockedURI + ';'
      })
    })
    // Prevent accidental real I/O while preserving evidence of every attempted external request.
    await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort('blockedbyclient'))
    const diagnose = process.env.TRAVELPILOT_PREVIEW_DURABILITY_DIAGNOSTICS === '1' && /^(stale auth|device-clock Today)/.test(info.title)
      ? await observePreviewChecklist(page, info, { tripId: snapshot.trip.id, itemId: orderedDefinitions(orderedDefinitions(orderedDefinitions((snapshot as TripSnapshot).checklists)[0].groups)[0].items)[0].id })
      : null
    try { await use() } finally {
      await diagnose?.()
      const violations = await page.locator('html').getAttribute('data-preview-blocked').catch(() => null)
      if (violations) blocked.push(violations)
      expect(external, 'Preview must not request ANY remote service, including Supabase/weather/JMA/media').toEqual([])
      expect(blocked, 'CSP must not be hiding attempted service calls').toEqual([])
      expect(errors, 'Preview browser errors').toEqual([])
    }
  }, { auto: true }],
})
async function open(page: Page, route = '/') {
  await page.goto(`${site}#${route}`)
  await expect(page.getByTestId('preview-notice')).toBeVisible()
}
async function trip(page: Page, view: string) {
  await open(page, `/trip/${descriptor.slug}/${view}`)
  await expect(page.getByTestId('trip-source')).toHaveText('POC 資料來源：preview')
  await expect(page.getByTestId('trip-versions')).toContainText(descriptor.dataVersion)
  await expect(page.locator('.trip-heading h2')).toHaveText(snapshot.trip.title)
}
async function layout(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  const notice = await page.getByTestId('preview-notice').boundingBox()
  const header = await page.locator('.app-header').boundingBox()
  const main = await page.locator('main').boundingBox()
  const status = await page.locator('.app-status').boundingBox()
  expect(notice!.y).toBeGreaterThanOrEqual(0)
  expect(header!.y).toBeGreaterThanOrEqual(notice!.y + notice!.height - 1)
  expect(main!.height).toBeGreaterThan(100)
  expect(main!.y + main!.height).toBeLessThanOrEqual(status!.y + 1)
  await expect(page.locator('.app-status')).toBeVisible()
}

test('normal runtime, entry, branding, assets and public manifest remain byte-identical', () => {
  assertSourceBaseline(['src', 'vite.config.ts', 'assets', 'public'], baseline)
  const walk = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)])
  const normal = walk('dist').filter(file => /\.(?:js|html|css|json)$/.test(file)).map(file => readFileSync(file, 'utf8')).join('\n')
  for (const marker of [descriptor.dataVersion, descriptor.sha256, 'isolated-preview-fixed-sample-v1', 'travelpilot-preview-v2-user-state', 'PREVIEW · 未發佈']) expect(normal).not.toContain(marker)
  expect(readFileSync('dist/index.html', 'utf8')).not.toContain('PREVIEW 未發佈')
  expect(readFileSync('dist-preview/index.html', 'utf8')).toContain('PREVIEW 未發佈')
  const isolated = walk('dist-preview').filter(file => /\.js$/.test(file)).map(file => readFileSync(file, 'utf8')).join('\n')
  for (const marker of ['sb_publishable_', 'supabase.co', 'api.open-meteo.com', '/auth/v1/', '/rest/v1/']) expect(isolated).not.toContain(marker)
  for (const file of ['travelpilot_banner.PNG', 'travelpilot_icon.PNG']) expect(readFileSync(`dist-preview/assets/images/${file}`)).toEqual(readFileSync(`assets/images/${file}`))
})

test('exact raw draft and manifest pass SHA256, canonical Schema and identity without mutation', () => {
  const input = readPreviewInput(process.cwd())
  expect(createHash('sha256').update(input.raw).digest('hex')).toBe(descriptor.sha256)
  const validated = validatePreviewInput(input, descriptor.sha256)
  expect(validated).toEqual(snapshot)
  expect(validated.schemaVersion).toBe(6)
  expect(validated.days).toHaveLength(9)
  expect(validated.places).toHaveLength(37)
})

for (const failure of ['missing', 'digest', 'schema', 'identity', 'manifest'] as const) test(`build input fails closed: ${failure}`, () => {
  const root = mkdtempSync(join(tmpdir(), 'travelpilot-preview-'))
  try {
    const input = readPreviewInput(process.cwd())
    for (const file of [descriptor.file, descriptor.manifest]) { mkdirSync(dirname(join(root, file)), { recursive: true }); writeFileSync(join(root, file), readFileSync(file)) }
    if (failure === 'missing') rmSync(join(root, descriptor.file))
    if (failure === 'digest') writeFileSync(join(root, descriptor.file), input.raw + '\n')
    if (failure === 'manifest') { const manifest = JSON.parse(readFileSync(descriptor.manifest, 'utf8')); manifest.published = true; writeFileSync(join(root, descriptor.manifest), JSON.stringify(manifest)) }
    if (failure === 'schema' || failure === 'identity') {
      const value = JSON.parse(input.raw)
      if (failure === 'schema') value.schemaVersion = 999
      else value.trip.slug = 'incorrect-generic-identity'
      const raw = JSON.stringify(value), sha256 = createHash('sha256').update(raw).digest('hex')
      expect(() => validatePreviewInput({ ...input, raw, sha256 }, sha256)).toThrow(/validation failed|identity mismatch/)
    } else expect(() => readPreviewInput(root)).toThrow()
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('Preview runtime contains no trip/geography routing or real transport imports', () => {
  const runtime = readdirSync('preview').filter(file => /\.(?:ts|tsx)$/.test(file) && !file.endsWith('.d.ts')).map(file => readFileSync(`preview/${file}`, 'utf8')).join('\n')
  for (const value of [descriptor.slug, 'Japan', 'Asia/Tokyo', 'Asia/Hong_Kong', 'shirakawago', 'createClient(', 'fetch(', 'XMLHttpRequest', 'WebSocket']) expect(runtime).not.toContain(value)
  expect(runtime).not.toMatch(/(?:if|switch)\s*\([^)]*(?:dayNumber|placeId|country)/)
  expect(readFileSync('preview/qaPreview.ts', 'utf8')).not.toContain('BASE_URL')
})

test('Home lists two demos plus one unpublished Preview without a demo badge or false remote source', async ({ page }) => {
  await open(page)
  await expect(page.locator('.trip-card')).toHaveCount(3)
  await expect(page.getByTestId('preview-notice').locator('[title]')).toHaveAttribute('title', /^[a-f0-9]{40}$/)
  expect(await page.evaluate(() => Object.keys(localStorage).filter(key => key.startsWith('sb-')))).toEqual([])
  await expect(page.locator('.badge-demo')).toHaveCount(2)
  const card = page.locator('.trip-card').filter({ has: page.getByRole('heading', { name: snapshot.trip.title, exact: true }) })
  await expect(card).toHaveCount(1)
  await expect(card.locator('.badge-demo')).toHaveCount(0)
  for (const shortcut of await card.locator('.trip-shortcut').all()) expect(await shortcut.getAttribute('href')).toContain(`/trip/${descriptor.slug}/`)
  await expect(page.getByRole('button', { name: '返回上一頁' })).toHaveCount(0)
  await card.getByRole('link', { name: `開啟 ${snapshot.trip.title}`, exact: true }).click()
  await expect(page.getByTestId('trip-source')).toContainText('preview')
  await page.getByRole('link', { name: '設定', exact: true }).click()
  await page.getByRole('button', { name: '返回上一頁' }).click()
  await expect(page).toHaveURL(new RegExp(`/trip/${descriptor.slug}/itinerary$`))
})

const views = [
  ['itinerary', 'detailed-itinerary'], ['info', 'trip-information'], ['attractions', 'attractions-overview'], ['live', 'live-cam'], ['today', 'today-mode'],
] as const
for (const font of ['small', 'medium', 'large']) for (const view of ['home', 'settings', ...views.map(([view]) => view)]) test(`${font} Preview ${view}: shared UI, reload, no overflow and zero service requests`, async ({ page }, info) => {
  await page.addInitScript(font => localStorage.setItem('travelpilot.font-size', font), font)
  if (view === 'home' || view === 'settings') await open(page, view === 'home' ? '/' : '/settings')
  else {
    await trip(page, view)
    await expect(page.getByTestId(views.find(([id]) => id === view)![1])).toBeVisible()
    await page.reload()
    await expect(page.getByTestId('trip-source')).toContainText('preview')
  }
  await expect(page.locator('html')).toHaveAttribute('data-font-size', font)
  await layout(page)
  if (['width-390', 'width-1440'].includes(info.project.name) && font === 'medium' && ['home', 'today'].includes(view) || info.project.name === 'width-320' && font === 'large' && ['home', 'info'].includes(view)) {
    await page.screenshot({ path: info.outputPath(`preview-${view}-${font}.png`) })
  }
})

test('stale auth/session and normal caches are ignored; local checklist persists, resets, and never syncs', async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('preview-test-seeded')) return
    sessionStorage.setItem('preview-test-seeded', 'yes')
    localStorage.setItem('sb-rihnuowhkzrpfkvrsxej-auth-token', '{"access_token":"synthetic-not-a-real-token","refresh_token":"synthetic","expires_at":1}')
    const request = indexedDB.open('travelpilot-v2-trips', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('sentinel')
    request.onsuccess = () => { const db = request.result; const tx = db.transaction('sentinel', 'readwrite'); tx.objectStore('sentinel').put('normal-cache-untouched', 'sentinel'); tx.oncomplete = () => db.close() }
  })
  await trip(page, 'info')
  await page.getByRole('button', { name: 'Checklist', exact: true }).click()
  const first = page.getByRole('checkbox').first()
  await first.check()
  await expect(first).toBeChecked()
  await expect(page.locator('.checklist-sync-label').first()).toHaveText('只儲存在此裝置')
  await page.reload()
  await expect(page.getByRole('checkbox').first()).toBeChecked()
  await page.getByRole('button', { name: 'Checklist', exact: true }).click()
  page.once('dialog', dialog => dialog.accept())
  await page.getByRole('button', { name: /^全部取消勾選：/ }).first().click()
  await expect(page.getByRole('checkbox').first()).not.toBeChecked()
  await page.reload()
  await expect(page.getByRole('checkbox').first()).not.toBeChecked()
  const databases = await page.evaluate(async () => (await indexedDB.databases()).map(db => db.name))
  expect(databases).toContain('travelpilot-preview-v2-user-state')
  expect(databases).not.toContain('travelpilot-v2-user-state')
  expect(await page.evaluate(() => localStorage.getItem('sb-rihnuowhkzrpfkvrsxej-auth-token'))).toContain('synthetic-not-a-real-token')
  const normal = await page.evaluate(() => new Promise((resolve, reject) => {
    const request = indexedDB.open('travelpilot-v2-trips')
    request.onsuccess = () => { const db = request.result; const tx = db.transaction('sentinel'); const get = tx.objectStore('sentinel').get('sentinel'); get.onsuccess = () => resolve(get.result); tx.oncomplete = () => db.close() }
    request.onerror = () => reject(new Error('Sentinel unreadable'))
  }))
  expect(normal).toBe('normal-cache-untouched')
  await open(page, '/settings')
  await expect(page.getByRole('textbox')).toHaveCount(0)
  await expect(page.getByRole('button', { name: /登入|登出|同步|更新/ })).toHaveCount(0)
  await expect(page.getByText('登入、Backend Check、雲端同步及更新檢查已停用。')).toBeVisible()
  await page.getByRole('radio', { name: '大', exact: true }).check()
  await page.reload()
  await expect(page.getByRole('radio', { name: '大', exact: true })).toBeChecked()
})

test('all weather regions use fixed five-day samples; JMA is unavailable, never no-warning proof', async ({ page }) => {
  await trip(page, 'itinerary')
  for (const region of snapshot.weather.weatherRegions) {
    await page.getByRole('group', { name: '天氣地區', exact: true }).getByRole('button', { name: region.label, exact: true }).click()
    const panel = page.getByTestId('weather-panel')
    await expect(panel).toHaveAttribute('data-weather-region', region.id)
    await expect(panel.locator('.weather-temperature')).toContainText('18')
    await expect(panel.locator('.weather-forecast-day')).toHaveCount(5)
    await expect(panel.locator('.weather-attribution')).toContainText('SIMULATED 固定樣本')
    await expect(panel).toContainText('暫時未能取得警告資料')
    await expect(panel.getByTestId('weather-panel-simulation')).toContainText('非真實 2027')
  }
  await expect(page.getByTestId('preview-notice')).toContainText('JMA／官方警告未連線、未驗證')
})

test('browser checksum mismatch stops before App and never falls back to published/cache/demo', async ({ page }) => {
  await page.route('**/assets/index-*.js', async route => {
    const response = await route.fetch(), original = await response.text()
    expect(original).toContain(descriptor.sha256)
    await route.fulfill({ response, body: original.replace(descriptor.sha256, '0'.repeat(64)) })
  })
  await open(page)
  await expect(page.getByRole('heading', { name: 'Preview 資料驗證失敗' })).toBeVisible()
  await expect(page.locator('.trip-card')).toHaveCount(0)
  await expect(page.locator('.app-header')).toHaveCount(0)
})

test('unknown trip fails generically; existing demos remain demo and views stay data-driven', async ({ page }) => {
  await open(page, '/trip/unknown-preview-trip/itinerary')
  await expect(page.getByRole('heading', { name: '找不到旅程' })).toBeVisible()
  for (const slug of ['demo-trip', 'demo-road-trip']) {
    await open(page, `/trip/${slug}/itinerary`)
    await expect(page.getByTestId('trip-source')).toHaveText('POC 資料來源：demo')
  }
})

test('Live Cam remains explicit external actions without automatic playback/navigation', async ({ page, context }) => {
  await trip(page, 'live')
  await expect(page.locator('iframe, video')).toHaveCount(0)
  expect(context.pages()).toHaveLength(1)
  expect(page.url()).toBe(`${site}#/trip/${descriptor.slug}/live`)
  await expect(page.locator('a[target="_blank"]').first()).toHaveAttribute('rel', /noopener/)
})

test('shared page definitions remain exactly the existing seven routes', () => {
  expect(pages.map(page => page.title)).toEqual(['首頁', '詳細行程', '旅程資料', '景點總覽', 'Live Cam', '今日模式', '設定'])
})

test('separate Preview origin does not read or change normal-origin preferences/cache', async ({ page, context }) => {
  await open(page, '/settings')
  await page.getByRole('radio', { name: '大', exact: true }).check()
  const normal = await context.newPage()
  try {
    // Static local image establishes the normal origin without starting normal network services.
    await normal.goto('http://127.0.0.1:4173/travelpilot-poc/assets/images/travelpilot_icon.PNG')
    expect(await normal.evaluate(() => localStorage.getItem('travelpilot.font-size'))).toBeNull()
    expect(await normal.evaluate(async () => (await indexedDB.databases()).map(db => db.name))).not.toContain('travelpilot-preview-v2-user-state')
    await normal.evaluate(() => localStorage.setItem('travelpilot.font-size', 'small'))
    await page.reload()
    await expect(page.getByRole('radio', { name: '大', exact: true })).toBeChecked()
    expect(await normal.evaluate(() => localStorage.getItem('travelpilot.font-size'))).toBe('small')
  } finally { await normal.close() }
})

test('device-clock Today manual controls and warm offline local checklist remain usable', async ({ page, context }) => {
  await trip(page, 'today')
  const last = (snapshot as TripSnapshot).days.filter(day => !isOperationalDay(snapshot, day, new Date())).at(-1)!
  await page.getByRole('navigation', { name: '今日模式行程日期' }).getByRole('button', { name: `D${last.dayNumber}`, exact: true }).click()
  await expect(page.getByTestId('today-mode')).toHaveAttribute('data-selected-day', last.id)
  await expect(page.getByTestId('today-mode')).toHaveAttribute('data-progress-mode', 'preview')
  await expect(page.getByRole('button', { name: '按時間自動', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: '已到達／下一項 →', exact: true }).click()
  await expect(page.getByTestId('today-mode')).toHaveAttribute('data-progress-mode', 'preview')
  await context.setOffline(true)
  try {
    await page.getByRole('link', { name: '旅程資料', exact: true }).click()
    await expect(page.getByTestId('trip-information')).toBeVisible()
    await page.getByRole('button', { name: 'Checklist', exact: true }).click()
    await page.getByRole('checkbox').first().check()
    await expect(page.locator('.checklist-sync-label').first()).toHaveText('只儲存在此裝置')
    await expect(page.locator('.app-status')).toContainText('OFFLINE')
  } finally { await context.setOffline(false) }
  // Reload is online against the local test server; no cold-start/PWA offline claim.
  await page.reload()
  await expect(page.getByRole('checkbox').first()).toBeChecked()
  await page.getByRole('link', { name: '今日模式', exact: true }).click()
  const expected = selectTodayDay(snapshot, new Date(), last.id)!
  await expect(page.getByTestId('today-mode')).toHaveAttribute('data-selected-day', expected.id)
})
