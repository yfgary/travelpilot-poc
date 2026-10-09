import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { test, expect, storageKey, fakeSession, supabaseOrigin, testUser } from './fixtures'
import { japan, japanBytes, japanVersion, japanRow, mockJapan } from './japanFixtures'
import { seedAuth, cacheContents } from './tripFixtures'
import { validateTripSnapshot, CURRENT_TRIP_SCHEMA_VERSION, SUPPORTED_TRIP_SCHEMA_VERSIONS } from '../src/data/schema/trip'
import { localTrips } from '../src/data/trips'
import { validateRemoteTrip } from '../src/services/trips'
import { tripShortcuts } from '../src/data/tripPresentation'
import { selectTodayDay, deriveToday } from '../src/data/today'
import { jmaConfigurationSchema } from '../src/data/schema/weather'
import metadata from '../package.json' with { type: 'json' }

const slug = japan.trip.slug
const homeCard = (page: import('@playwright/test').Page) => page.getByRole('article').filter({ hasText: japan.trip.title })

test('exact canonical Japan bytes, stable identity, Schema 5 and fixed approved itinerary validate', () => {
  expect(createHash('sha256').update(japanBytes).digest('hex')).toBe('09a0bc1a5b75e50b579fd5ec4596912026cf8311fdf262df0c14ca6e235ea57e')
  expect(validateTripSnapshot(JSON.parse(japanBytes.toString()))).toMatchObject({ valid: true })
  expect(japan.trip.id).toBe('349442d2-7bf3-426b-9f57-163e2272e909'); expect(slug).toBe('shirakawago-shinhotaka-2027'); expect(japan.schemaVersion).toBe(5); expect(japan.days).toHaveLength(9)
  for (const [number, title] of [[6, '白川鄉'], [7, '新穗高'], [8, '飛驒大鐘乳洞 → 松本']] as const) expect(japan.days.find((day) => day.dayNumber === number)!.title).toContain(title)
  const start = japan.days[0].timeline.find((item) => item.id === 'jp27-tl-d1-uo680')!.timing!
  expect(start).toEqual({ start: { dateTime: '2027-01-09T10:00:00+08:00', timeZone: 'Asia/Hong_Kong' }, end: { dateTime: '2027-01-09T14:30:00+09:00', timeZone: 'Asia/Tokyo' } })
  const end = japan.days[8].timeline.find((item) => item.id === 'jp27-tl-d9-flight')!.timing!
  expect(end.end.dateTime).toBe('2027-01-18T00:30:00+08:00'); expect(end.start.timeZone).toBe('Asia/Tokyo'); expect(end.end.timeZone).toBe('Asia/Hong_Kong')
  expect(japanVersion().data_version).toBe('jp2027.1')
})
test('approved image bytes, semantic targets and attribution resolve without a brand fallback', async ({ request }) => {
  const provenance = JSON.parse(readFileSync('assets/trips/shirakawago-shinhotaka-2027/provenance.json', 'utf8'))
  expect(provenance.productionSourceCommit).toBe('8b5129b381d6ace94030b51c7b8de5c4e3d5f533'); expect(provenance.assets).toHaveLength(25)
  for (const asset of provenance.assets) {
    expect(createHash('sha256').update(readFileSync(asset.target)).digest('hex')).toBe(asset.sha256)
    expect(asset.target).not.toMatch(/\/d\d-/)
    const response = await request.get(asset.target); expect(response.ok()).toBe(true)
    expect(createHash('sha256').update(await response.body()).digest('hex')).toBe(asset.sha256)
  }
  for (const image of japan.images) { expect(image.url).not.toContain('travelpilot_banner'); expect(readFileSync(image.url).length).toBeGreaterThan(0) }
  expect(japan.images.find((image) => image.id === japan.trip.heroImageId)).toMatchObject({ attribution: 'Raita Futo / Wikimedia Commons', licenseNote: expect.stringContaining('CC BY 2.0') })
})
test('real trip is not local demo; row/schema/UUID/ownership consistency remains mandatory', () => {
  expect(localTrips.map((record) => record.payload.trip.slug).sort()).toEqual(['demo-road-trip', 'demo-trip'])
  expect(validateRemoteTrip(japanRow(), japanVersion(), testUser.id)).toMatchObject({ state: 'loaded', source: 'remote', dataVersion: 'jp2027.1' })
  for (const patch of [{ schema_version: 4 }, { schema_version: 6 }, { payload: { ...japan, trip: { ...japan.trip, id: crypto.randomUUID() } } }, { payload: { ...japan, trip: { ...japan.trip, slug: 'wrong' } } }]) expect(validateRemoteTrip(japanRow(), { ...japanVersion(), ...patch }, testUser.id).state).not.toBe('loaded')
  expect(validateRemoteTrip({ ...japanRow(), owner_id: crypto.randomUUID() }, japanVersion(), testUser.id).state).toBe('invalid-data')
})
test('Home merges real trip with demos using two owner-scoped batched GETs, shared shortcuts and immutable payload', async ({ page }) => {
  await seedAuth(page); const requests = await mockJapan(page); await page.goto('#/')
  await expect(page.getByRole('article')).toHaveCount(3)
  const card = homeCard(page); await expect(card).toBeVisible(); await expect(card).not.toContainText('示範資料')
  await expect(card).toContainText(japan.trip.destinationLabel); await expect(card).toContainText(japan.trip.summary)
  expect(await card.locator('.trip-cover img').getAttribute('src')).toContain('banner-shirakawago-winter.jpg')
  for (const shortcut of tripShortcuts(japan)) await expect(card.locator(`.trip-card-actions a[href="#/trip/${slug}/${shortcut.path}"]`)).toHaveCount(1)
  expect(requests).toHaveLength(2); expect(requests.every((r) => r.method === 'GET')).toBe(true)
  expect(requests[0].params.owner_id).toBe(`eq.${testUser.id}`)
  expect(requests[1].params.trip_id).toBe(`in.(${japan.trip.id})`); expect(requests[1].params).toMatchObject({ status: 'eq.published', is_current: 'eq.true' })
  const cached = await cacheContents(page); expect(cached.versions).toHaveLength(1); expect(cached.versions[0]).toMatchObject({ dataVersion: 'jp2027.1', payload: japan })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})
for (const view of ['itinerary', 'info', 'attractions', 'live', 'today']) test(`Japan ${view} shared route direct reload retains correct metadata/version and no overflow`, async ({ page }) => {
  await seedAuth(page); await mockJapan(page); await page.goto(`#/trip/${slug}/${view}`)
  for (let reload = 0; reload < 2; reload++) {
    if (reload) await page.reload()
    await expect(page.locator('.trip-heading h2')).toHaveText(japan.trip.title)
    await expect(page.getByTestId('trip-versions')).toHaveText('Trip Data Version：jp2027.1 · Trip Schema Version：5')
    await expect(page.getByTestId('trip-source')).toContainText('remote')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('status')).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
  await page.getByRole('navigation', { name: '主導覽' }).getByRole('link', { name: '設定', exact: true }).click()
  await page.getByRole('button', { name: '返回上一頁' }).click(); await expect(page).toHaveURL(new RegExp(`#/trip/${slug}/${view}$`))
})
test('Detailed Itinerary preserves D6–D8 and exact D1/D9 offset/date/zone display', async ({ page }, testInfo) => {
  await seedAuth(page); await mockJapan(page); await page.goto(`#/trip/${slug}/itinerary`)
  await expect(page.locator('.trip-heading h2')).toHaveText(japan.trip.title)
  for (const n of [1, 6, 7, 8, 9]) {
    const day = japan.days.find((day) => day.dayNumber === n)!
    const section = page.locator(`details[data-day-id="${day.id}"]`)
    if (await section.getAttribute('open') === null) await section.locator('summary').first().click()
    await expect(section).toContainText(day.title)
  }
  for (const timing of [japan.days[0].timeline.find((i) => i.id === 'jp27-tl-d1-uo680')!.timing!, japan.days[8].timeline.find((i) => i.id === 'jp27-tl-d9-flight')!.timing!]) {
    for (const endpoint of [timing.start, timing.end]) {
      const time = page.locator(`time[datetime="${endpoint.dateTime}"]`)
      await expect(time).toBeVisible(); await expect(time).toContainText(endpoint.timeZone)
      await time.scrollIntoViewIfNeeded(); await page.screenshot({ path: testInfo.outputPath(`exact-${endpoint.dateTime.replace(/[^0-9]/g, '')}.png`) })
    }
  }
})
test('Today uses the exact return-flight owning day after trip-local midnight', async ({ page }) => {
  const now = Date.parse('2027-01-17T15:15:00Z')
  expect(selectTodayDay(japan, new Date(now))?.id).toBe(japan.days[8].id)
  expect(deriveToday(japan, japan.days[8], new Date(now)).actualToday).toBe(true)
  await page.clock.install({ time: new Date(now) }); await page.addInitScript(({ key, session }) => localStorage.setItem(key, JSON.stringify(session)), { key: storageKey, session: fakeSession(Math.floor(now / 1000) + 3600) }); await mockJapan(page); await page.goto(`#/trip/${slug}/today`)
  await expect(page.getByTestId('today-mode')).toBeVisible(); await expect(page.getByText('預覽模式', { exact: true })).toHaveCount(0)
  await expect(page.getByTestId('today-mode')).toContainText('UO685'); await expect(page.getByTestId('today-mode')).toContainText('Asia/Hong_Kong')
})
test('weather mappings and JMA code-first contract remain canonical', () => {
  expect(japan.weather.dayRegions).toHaveLength(9)
  for (const mapping of japan.weather.dayRegions) { expect(japan.days.some((d) => d.id === mapping.dayId)).toBe(true); expect(japan.weather.weatherRegions.some((r) => r.id === mapping.weatherRegionId)).toBe(true) }
  const config = jmaConfigurationSchema.parse(japan.weather.alertProviders[0].config)
  expect(config.regionGroups.map((group) => group.jmaAreaCodes)).toEqual([['200000'], ['210000']])
  for (const patch of [{ regionGroups: [{ ...config.regionGroups[0], jmaAreaCodes: [] }] }, { feedURLs: { ...config.feedURLs, weatherExtra: 'https://proxy.invalid/feed.xml' } }]) expect(jmaConfigurationSchema.safeParse({ ...config, ...patch }).success).toBe(false)
})
test('malformed/unsupported/unowned remote cards never break good trips or demos', async ({ page }) => {
  await seedAuth(page)
  const badRows = [japanRow(), { id: crypto.randomUUID(), slug: 'broken-trip', owner_id: testUser.id }, { id: crypto.randomUUID(), slug: 'future-trip', owner_id: testUser.id }, { id: crypto.randomUUID(), slug: 'foreign-trip', owner_id: crypto.randomUUID() }]
  const versions = [japanVersion(), { ...japanVersion(), trip_id: badRows[1].id, payload: {} }, { ...japanVersion(), trip_id: badRows[2].id, schema_version: 6 }]
  await mockJapan(page, { trips: badRows, versions }); await page.goto('#/')
  await expect(page.getByRole('article')).toHaveCount(3); await expect(homeCard(page)).toBeVisible(); await expect(page.getByText('部分旅程資料未能通過驗證，其他旅程仍可使用。')).toBeVisible()
  expect((await cacheContents(page)).versions).toHaveLength(1)
})
test('signed-out offline Home and route use validated device cache without marking real data demo', async ({ page, context }) => {
  await seedAuth(page); await mockJapan(page); await page.goto('#/'); await expect(homeCard(page)).toBeVisible()
  await page.evaluate((key) => localStorage.removeItem(key), storageKey); await page.reload(); await context.setOffline(true); await page.evaluate(() => window.dispatchEvent(new Event('offline')))
  await expect(homeCard(page)).toBeVisible(); await expect(homeCard(page)).not.toContainText('示範資料')
  await homeCard(page).getByRole('link', { name: '詳細行程', exact: true }).click(); await expect(page.getByTestId('trip-source')).toContainText('cache'); await expect(page.locator('.trip-heading h2')).toHaveText(japan.trip.title)
})
test('switching to another signed-in owner hides the previous owner Home cache', async ({ page }) => {
  await seedAuth(page); await mockJapan(page); await page.goto('#/'); await expect(homeCard(page)).toBeVisible()
  const session = fakeSession(); session.user = { ...session.user, id: '00000000-0000-4000-8000-000000000099' }
  await page.evaluate(({ key, session }) => localStorage.setItem(key, JSON.stringify(session)), { key: storageKey, session })
  await page.route(`${supabaseOrigin}/rest/v1/v2_trips**`, (route) => route.fulfill({ json: [] })); await page.reload()
  await expect(page.getByTestId('trip-list-loading')).toHaveCount(0); await expect(page.getByRole('article')).toHaveCount(2); await expect(homeCard(page)).toHaveCount(0)
})
test('invalid remote update leaves valid Home/route cache byte-equivalent and version intact', async ({ page }) => {
  await seedAuth(page); await mockJapan(page); await page.goto('#/'); await expect(homeCard(page)).toBeVisible()
  const before = await cacheContents(page)
  await page.route(`${supabaseOrigin}/rest/v1/v2_trip_versions**`, (route) => route.fulfill({ json: [{ ...japanVersion(), data_version: 'invalid.2', payload: {} }] })); await page.reload()
  await expect(page.getByTestId('trip-list-loading')).toHaveCount(0); await expect(homeCard(page)).toBeVisible(); expect(await cacheContents(page)).toEqual(before)
  await homeCard(page).getByRole('link', { name: '詳細行程', exact: true }).click(); await expect(page.getByTestId('trip-source')).toContainText('cache')
})
test('Step 15C version/readers/source audit preserves production, database and local fixture boundaries', () => {
  const candidate = /^2\.0\.0-poc\.(\d+)$/.exec(metadata.version)
  expect(candidate).not.toBeNull()
  expect(Number(candidate![1])).toBeGreaterThanOrEqual(26); expect(CURRENT_TRIP_SCHEMA_VERSION).toBe(5); expect(SUPPORTED_TRIP_SCHEMA_VERSIONS).toEqual([1,2,3,4,5])
  expect(localTrips.map((r) => r.dataVersion).sort()).toEqual(['demo.city.5','demo.road.5'])
  const walk = (path: string): string[] => readdirSync(path, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walk(join(path, entry.name)) : [join(path, entry.name)])
  for (const path of walk('src').filter((path) => !path.includes('/demoTrips/'))) {
    const source = readFileSync(path, 'utf8')
    expect(source, path).not.toMatch(/shirakawago|shinhotaka|jp27-|jp2027|UO680|UO685|200000|210000|Asia\/Tokyo|Asia\/Hong_Kong|Japan|Nagoya/)
    expect(source, path).not.toMatch(/trip_checklist_state|trip_checklist_shared|trip_sync_config|sb_secret_/)
  }
  const loader = readFileSync('src/services/trips.ts', 'utf8')
  expect(loader).not.toMatch(/\.(?:insert|upsert|update|delete|rpc)\s*\(/)
  expect(execFileSync('git', ['diff', 'HEAD', '--', 'supabase', 'src/data/schema/trip.ts', 'src/data/demoTrips', 'src/data/trips.ts', 'src/offline', 'assets/images', '.github'], { encoding: 'utf8' })).toBe('')
})

test('two unrelated remote records share one version batch and independent Home cache pointers', async ({ page }) => {
  await seedAuth(page)
  const other = structuredClone(japan), id = crypto.randomUUID()
  other.trip = { ...other.trip, id, slug: 'second-remote-trip', title: '另一個遠端旅程' }
  const requests = await mockJapan(page, { trips: [japanRow(), { id, slug: other.trip.slug, owner_id: testUser.id }], versions: [japanVersion(), { ...japanVersion(), trip_id: id, payload: other, data_version: 'other.1' }] })
  await page.goto('#/'); await expect(page.getByRole('article')).toHaveCount(4)
  expect(requests).toHaveLength(2); expect(requests[1].params.trip_id).toContain(id); expect(requests[1].params.trip_id).toContain(japan.trip.id)
  const contents = await cacheContents(page); expect(contents.versions).toHaveLength(2); expect(contents.pointers).toHaveLength(2)
  expect(contents.versions).toEqual(expect.arrayContaining([expect.objectContaining({ tripId: id, slug: other.trip.slug, dataVersion: 'other.1', payload: other }), expect.objectContaining({ tripId: japan.trip.id, slug, dataVersion: 'jp2027.1', payload: japan })]))
})
for (const view of ['home', 'itinerary', 'info', 'attractions', 'live', 'today']) test(`Japan ${view} remains usable with Large font; responsive visual capture`, async ({ page }, testInfo) => {
  await page.addInitScript(() => localStorage.setItem('travelpilot.font-size', 'large'))
  await seedAuth(page); await mockJapan(page)
  await page.goto(view === 'home' ? '#/' : `#/trip/${slug}/${view}`)
  if (view === 'home') await expect(homeCard(page)).toBeVisible()
  else await expect(page.locator('.trip-heading h2')).toHaveText(japan.trip.title)
  // Full-page QA explicitly loads lazy fixture images; normal application loading remains lazy.
  await page.evaluate(async () => { await document.fonts.ready; for (const image of document.images) image.loading = 'eager'; await Promise.all([...document.images].map((image) => image.decode().catch(() => undefined))) })
  expect(await page.evaluate(() => document.documentElement.dataset.fontSize)).toBe('large')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await expect(page.getByRole('status')).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath(`japan-${view}-large.png`), fullPage: true })
  const selectors: Record<string, string> = { home: '.home-trips', itinerary: '.itinerary-page', info: '.trip-info-page', attractions: '.attractions-page', live: '.live-cam-page', today: '.today-page' }
  await page.locator(selectors[view]).evaluate((node) => node.scrollIntoView({ block: 'start' }))
  await page.screenshot({ path: testInfo.outputPath(`japan-${view}-content-large.png`) })
  await page.locator('main').evaluate((node) => { node.scrollTop = node.scrollHeight })
  await page.screenshot({ path: testInfo.outputPath(`japan-${view}-bottom-large.png`) })
})

test('Home snapshot-aware operational status remains current until exact arrival, without extending displayed dates', async ({ page }) => {
  const now = Date.parse('2027-01-17T15:15:00Z')
  await page.clock.install({ time: new Date(now) })
  await page.addInitScript(({ key, session }) => localStorage.setItem(key, JSON.stringify(session)), { key: storageKey, session: fakeSession(Math.floor(now / 1000) + 86400) })
  await mockJapan(page); await page.goto('#/')
  await expect(homeCard(page).getByTestId('trip-status')).toHaveText('旅程進行中')
  await expect(homeCard(page).locator('time').last()).toHaveAttribute('datetime', '2027-01-17')
  await page.clock.setSystemTime(new Date('2027-01-17T16:30:00Z')); await page.reload()
  await expect(homeCard(page).getByTestId('trip-status')).toHaveText('旅程已完成')
  await expect(homeCard(page).locator('time').last()).toHaveAttribute('datetime', '2027-01-17')
})
