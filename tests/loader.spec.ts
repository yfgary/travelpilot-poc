import { test, expect, supabaseOrigin, testUser, storageKey, fakeSession } from './fixtures'
import { seedAuth, mockRemote, remoteVersion, remoteId, remoteSlug, cacheContents } from './tripFixtures'
import type { Page } from '@playwright/test'
const itinerary = `#/trip/${remoteSlug}/itinerary`
const dataSource = (page: Page) => page.getByTestId('trip-source')

async function loadRemote(page: Page) {
  await seedAuth(page); await mockRemote(page); await page.goto(itinerary)
  await expect(dataSource(page)).toHaveText('POC 資料來源：remote')
}

test('authenticated remote read is owner-scoped and requires current published version; versions are separate', async ({ page }) => {
  await seedAuth(page)
  const requests: string[] = []
  let release!: () => void
  const gate = new Promise<void>((resolve) => { release = resolve })
  await page.route(`${supabaseOrigin}/rest/v1/**`, async (route) => {
    const request = route.request(), url = new URL(request.url())
    requests.push(url.pathname)
    expect(request.method()).toBe('GET')
    if (url.pathname.endsWith('/v2_trips')) {
      expect(url.searchParams.get('owner_id')).toBe(`eq.${testUser.id}`)
      expect(url.searchParams.get('slug')).toBe(`eq.${remoteSlug}`)
      await gate
      await route.fulfill({ json: [{ id: remoteId, slug: remoteSlug, owner_id: testUser.id }] })
    } else {
      expect(url.pathname).toBe('/rest/v1/v2_trip_versions')
      expect(url.searchParams.get('trip_id')).toBe(`eq.${remoteId}`)
      expect(url.searchParams.get('status')).toBe('eq.published')
      expect(url.searchParams.get('is_current')).toBe('eq.true')
      await route.fulfill({ json: [remoteVersion()] })
    }
  })
  await page.goto(itinerary)
  await expect(page.getByRole('heading', { name: '正在載入旅程' })).toBeVisible()
  await expect(page.getByRole('status')).toBeVisible()
  release()
  await expect(dataSource(page)).toHaveText('POC 資料來源：remote')
  await expect(page.locator('.trip-heading h2')).toHaveText('通用遠端測試旅程')
  await expect(page.getByTestId('trip-versions')).toHaveText('Trip Data Version：content.1 · Trip Schema Version：1')
  await expect(page.getByRole('status')).toContainText('App Version v2.0.0-poc.4')
  expect(requests).toEqual(['/rest/v1/v2_trips', '/rest/v1/v2_trip_versions'])
  const cached = await cacheContents(page)
  expect(cached.versions).toHaveLength(1)
  expect(cached.versions[0]).toMatchObject({ tripId: remoteId, slug: remoteSlug, dataVersion: 'content.1', schemaVersion: 1 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('new version preserves older snapshot and current pointer across reload; invalid update cannot overwrite', async ({ page }) => {
  await seedAuth(page)
  let version = remoteVersion()
  await mockRemote(page, () => version)
  await page.goto(itinerary)
  await expect(dataSource(page)).toContainText('remote')
  version = { ...remoteVersion(), data_version: 'content.2' }
  version.payload.trip.summary = '第二個資料版本'
  await page.reload()
  await expect(page.getByTestId('trip-versions')).toContainText('content.2')
  const before = await cacheContents(page)
  expect(before.versions).toHaveLength(2)
  expect(before.versions).toEqual(expect.arrayContaining([
    expect.objectContaining({ dataVersion: 'content.1', payload: expect.objectContaining({ trip: expect.objectContaining({ summary: remoteVersion().payload.trip.summary }) }) }),
    expect.objectContaining({ dataVersion: 'content.2', payload: expect.objectContaining({ trip: expect.objectContaining({ summary: '第二個資料版本' }) }) }),
  ]))
  version = { ...remoteVersion(), data_version: 'content.3' }
  version.payload.days[0].timeline[0].placeId = 'broken-reference'
  await page.reload()
  await expect(dataSource(page)).toContainText('cache')
  await expect(page.getByTestId('trip-versions')).toContainText('content.2')
  expect(await cacheContents(page)).toEqual(before)
})

for (const boundary of ['trip', 'version'] as const) {
  test(`remote ${boundary} failure uses validated persisted cache after reload`, async ({ page }) => {
    await loadRemote(page)
    await page.route(`${supabaseOrigin}/rest/v1/${boundary === 'trip' ? 'v2_trips' : 'v2_trip_versions'}**`, (route) => route.fulfill({ status: 503, json: { message: 'Internal error - must not render' } }))
    await page.reload()
    await expect(dataSource(page)).toContainText('cache')
    await expect(page.getByRole('heading', { name: '詳細行程', exact: true })).toBeVisible()
    await expect(page.getByText('Internal error - must not render')).toHaveCount(0)
  })
}

test('logout keeps cache readable while signed out/offline and after browser reload', async ({ page, context }) => {
  await loadRemote(page)
  const before = await cacheContents(page)
  await page.route(`${supabaseOrigin}/auth/v1/logout**`, (route) => route.fulfill({ status: 204 }))
  await page.getByRole('navigation', { name: '主導覽' }).getByRole('link', { name: '設定' }).click()
  await page.getByRole('button', { name: '登出', exact: true }).click()
  await expect(page.getByRole('button', { name: '登入', exact: true })).toBeVisible()
  expect(await cacheContents(page)).toEqual(before)
  await page.getByRole('button', { name: '返回上一頁' }).click()
  await expect(dataSource(page)).toContainText('cache')
  await page.reload()
  await expect(dataSource(page)).toContainText('cache')
  await context.setOffline(true)
  await page.getByRole('navigation', { name: '旅程頁面' }).getByRole('link', { name: '旅程資料', exact: true }).click()
  await expect(page.getByRole('heading', { name: '旅程資料', exact: true })).toBeVisible()
  await expect(dataSource(page)).toContainText('cache')
  await expect(page.getByRole('status')).toContainText('OFFLINE')
  expect(await cacheContents(page)).toEqual(before)
})

test('signed-in offline read uses cache without remote queries', async ({ page, context }) => {
  await loadRemote(page)
  await context.setOffline(true)
  await expect(page.getByRole('status')).toContainText('OFFLINE')
  await page.getByRole('navigation', { name: '主導覽' }).getByRole('link', { name: '首頁', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('每一段旅程，都準備妥當。')
  let remoteRequests = 0
  await page.route(`${supabaseOrigin}/rest/v1/**`, (route) => { remoteRequests++; return route.abort() })
  await page.evaluate((slug) => { location.hash = `/trip/${slug}/info` }, remoteSlug)
  await expect(dataSource(page)).toContainText('cache')
  expect(remoteRequests).toBe(0)
})

test('different signed-in account cannot fall back to another owners cache', async ({ page }) => {
  await loadRemote(page)
  const session = fakeSession()
  session.user = { ...testUser, id: '00000000-0000-4000-8000-000000000003' }
  await page.evaluate(({ key, session }) => localStorage.setItem(key, JSON.stringify(session)), { key: storageKey, session })
  await page.route(`${supabaseOrigin}/rest/v1/v2_trips**`, (route) => route.fulfill({ status: 503, json: { message: 'Unavailable' } }))
  await page.reload()
  await expect(page.getByRole('heading', { name: '暫時未能載入旅程' })).toBeVisible()
  await expect(dataSource(page)).toHaveCount(0)
  expect((await cacheContents(page)).versions).toHaveLength(1)
})

test('corrupted cached payload is revalidated and rejected', async ({ page }) => {
  await loadRemote(page)
  await page.evaluate(async () => {
    const request = indexedDB.open('travelpilot-v2-trips', 1)
    const db = await new Promise<IDBDatabase>((resolve) => { request.onsuccess = () => resolve(request.result) })
    const tx = db.transaction('versions', 'readwrite'), store = tx.objectStore('versions'), records = store.getAll()
    records.onsuccess = () => { const record = records.result[0]; record.payload.trip.startDate = 'invalid'; store.put(record) }
    await new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error) }); db.close()
  })
  await page.route(`${supabaseOrigin}/rest/v1/v2_trips**`, (route) => route.fulfill({ status: 503, json: {} }))
  await page.reload()
  await expect(page.getByRole('heading', { name: '暫時未能載入旅程' })).toBeVisible()
})

test('unavailable remote with no cache gives generic state, still showing shared shell', async ({ page }) => {
  await seedAuth(page)
  await page.route(`${supabaseOrigin}/rest/v1/v2_trips**`, (route) => route.fulfill({ status: 503, json: { message: 'Database internals' } }))
  await page.goto(itinerary)
  await expect(page.getByRole('heading', { name: '暫時未能載入旅程' })).toBeVisible()
  await expect(page.getByRole('status')).toBeVisible()
  await expect(page.getByText('Database internals')).toHaveCount(0)
})

const invalidCases: [string, (version: ReturnType<typeof remoteVersion>) => void, string][] = [
  ['unsupported row schema', (v) => { v.schema_version = 2 }, '未支援此旅程資料格式'],
  ['unsupported payload schema', (v) => { v.payload.schemaVersion = 2 as 1 }, '未支援此旅程資料格式'],
  ['slug mismatch', (v) => { v.payload.trip.slug = 'wrong-slug' }, '旅程資料未能通過驗證'],
  ['trip ID mismatch', (v) => { v.payload.trip.id = 'wrong-id' }, '旅程資料未能通過驗證'],
  ['version trip ID mismatch', (v) => { v.trip_id = '00000000-0000-4000-8000-000000000004' }, '旅程資料未能通過驗證'],
  ['draft row', (v) => { v.status = 'draft' }, '旅程資料未能通過驗證'],
  ['noncurrent row', (v) => { v.is_current = false }, '旅程資料未能通過驗證'],
  ['broken references', (v) => { v.payload.days[0].timeline[0].placeId = 'missing' }, '旅程資料未能通過驗證'],
]
for (const [name, mutate, heading] of invalidCases) {
  test(`${name} is rejected without caching any payload`, async ({ page }) => {
    await seedAuth(page)
    const version = remoteVersion(); mutate(version)
    await mockRemote(page, () => version)
    await page.goto(itinerary)
    await expect(page.getByRole('heading', { name: heading })).toBeVisible()
    const cached = await cacheContents(page)
    expect(cached.versions).toHaveLength(0); expect(cached.pointers).toHaveLength(0); expect(cached.device).toHaveLength(0)
  })
}

test('no published current version and unknown slug show generic not found', async ({ page }) => {
  await seedAuth(page); await mockRemote(page)
  await page.route(`${supabaseOrigin}/rest/v1/v2_trip_versions**`, (route) => route.fulfill({ json: [] }))
  await page.goto(itinerary)
  await expect(page.getByRole('heading', { name: '找不到旅程' })).toBeVisible()
  await page.route(`${supabaseOrigin}/rest/v1/v2_trips**`, (route) => route.fulfill({ json: [] }))
  await page.reload()
  await expect(page.getByRole('heading', { name: '找不到旅程' })).toBeVisible()
})

test('signed-out uncached trip requests authentication, while demo requires no Supabase trip reads', async ({ page }) => {
  let requests = 0
  await page.route(`${supabaseOrigin}/rest/v1/**`, (route) => { requests++; return route.fulfill({ status: 403, json: {} }) })
  await page.goto(itinerary)
  await expect(page.getByText('請先登入，以讀取帳戶旅程。此裝置尚未儲存這個旅程。')).toBeVisible()
  await page.goto('#/trip/demo-trip/itinerary')
  await expect(dataSource(page)).toContainText('demo')
  await expect(page.getByTestId('trip-versions')).toContainText('demo.1')
  expect(requests).toBe(0)
})

test('blocked IndexedDB keeps valid remote trip usable with cache notice', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(window, 'indexedDB', { get() { throw new Error('Blocked') } }) })
  await loadRemote(page)
  await expect(page.getByText('此裝置暫時未能儲存離線旅程。')).toBeVisible()
})

test('late remote response cannot replace another route or its metadata', async ({ page }) => {
  await seedAuth(page)
  let release!: () => void
  const gate = new Promise<void>((resolve) => { release = resolve })
  await page.route(`${supabaseOrigin}/rest/v1/v2_trips**`, async (route) => { await gate; await route.fulfill({ json: [{ id: remoteId, slug: remoteSlug, owner_id: testUser.id }] }) })
  await page.goto(itinerary)
  await expect(page.getByRole('heading', { name: '正在載入旅程' })).toBeVisible()
  await page.evaluate(() => { location.hash = '/trip/demo-trip/info' })
  await expect(dataSource(page)).toContainText('demo')
  release()
  await expect(page.locator('.trip-heading h2')).toHaveText('示範旅程')
  await expect(page.getByRole('heading', { name: '旅程資料', exact: true })).toBeVisible()
})

test('unsupported remote update falls back without changing any cached version or pointer', async ({ page }) => {
  await loadRemote(page)
  const before = await cacheContents(page)
  const next = { ...remoteVersion(), schema_version: 2, data_version: 'content.future' }
  await page.route(`${supabaseOrigin}/rest/v1/v2_trip_versions**`, (route) => route.fulfill({ json: [next] }))
  await page.reload()
  await expect(dataSource(page)).toContainText('cache')
  await expect(page.getByTestId('trip-versions')).toContainText('content.1')
  expect(await cacheContents(page)).toEqual(before)
})

test('opaque Data Version labels retain exact database identities without merging cached versions', async ({ page }) => {
  await seedAuth(page)
  let version = remoteVersion()
  await mockRemote(page, () => version)
  await page.goto(itinerary)
  await expect(dataSource(page)).toContainText('remote')
  version = { ...remoteVersion(), data_version: ' content.1 ' }
  version.payload.trip.summary = '獨立資料版本'
  await page.reload()
  await expect(page.locator('.trip-heading')).toContainText('獨立資料版本')
  const cached = await cacheContents(page)
  expect(cached.versions).toHaveLength(2)
  expect(cached.versions).toEqual(expect.arrayContaining([
    expect.objectContaining({ dataVersion: 'content.1' }),
    expect.objectContaining({ dataVersion: ' content.1 ' }),
  ]))
  expect(cached.pointers[0]).toMatchObject({ dataVersion: ' content.1 ' })
})
