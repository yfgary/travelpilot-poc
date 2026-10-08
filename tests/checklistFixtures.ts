import type { Page, Route } from '@playwright/test'
import { cityTrip } from '../src/data/demoTrips/cityTrip'
import { roadTrip } from '../src/data/demoTrips/roadTrip'
import type { TripSnapshot } from '../src/data/schema/trip'
import { compareChanges } from '../src/data/checklistState'
import { testUser, fakeSession, storageKey, supabaseOrigin, expect } from './fixtures'
import { seedAuth } from './tripFixtures'

export const syncCity = structuredClone(cityTrip), syncRoad = structuredClone(roadTrip)
syncCity.trip = { ...syncCity.trip, id: '00000000-0000-4000-8000-000000000012', slug: 'sync-city', title: '清單城市測試旅程' }
syncRoad.trip = { ...syncRoad.trip, id: '00000000-0000-4000-8000-000000000013', slug: 'sync-road', title: '清單自駕測試旅程' }
export type ServerRow = { user_id: string; trip_id: string; checklist_item_id: string; checked: boolean; client_updated_at: string; device_id: string | null; updated_at: string }
export const itemIds = (snapshot: TripSnapshot) => snapshot.checklists.flatMap((list) => list.groups.flatMap((group) => group.items.map((item) => item.id)))
export function serverRow(snapshot: TripSnapshot, index = 0, time = '2020-01-01T00:00:00Z', checked = true, device = 'server-device'): ServerRow {
  return { user_id: testUser.id, trip_id: snapshot.trip.id, checklist_item_id: itemIds(snapshot)[index], checked, client_updated_at: time, device_id: device, updated_at: '2026-10-08T00:00:00Z' }
}
export async function userContents(page: Page) {
  return page.evaluate(async () => {
    const request = indexedDB.open('travelpilot-v2-user-state', 1)
    const db = await new Promise<IDBDatabase>((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error) })
    try {
      const read = (store: string) => new Promise<any[]>((resolve, reject) => { const request = db.transaction(store).objectStore(store).getAll(); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error) })
      return { rows: await read('checklistState'), sync: await read('syncMeta'), meta: await read('meta') }
    } finally { db.close() }
  })
}
export async function putUserRows(page: Page, records: any[]) {
  await page.evaluate(async (records) => {
    const request = indexedDB.open('travelpilot-v2-user-state', 1)
    const db = await new Promise<IDBDatabase>((resolve) => { request.onsuccess = () => resolve(request.result) })
    const tx = db.transaction('checklistState', 'readwrite')
    for (const record of records) tx.objectStore('checklistState').put(record)
    await new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error) }); db.close()
  }, records)
}
export function localRow(row: ServerRow, dirty = true) {
  return { scope: row.user_id, ownerId: row.user_id, tripId: row.trip_id, checklistItemId: row.checklist_item_id, checked: row.checked, clientUpdatedAt: row.client_updated_at, deviceId: row.device_id ?? '', dirty }
}
export async function mockChecklistBackend(page: Page, snapshots = [syncCity, syncRoad]) {
  const backend = { rows: [] as ServerRow[], pulls: [] as string[], batches: [] as any[][], requests: [] as { method: string; table: string }[], fail: false,
    versions: new Map<string,string>(), beforePush: undefined as undefined | ((batch: any[]) => void), gate: undefined as undefined | Promise<void>, owner: testUser.id }
  await page.route(`${supabaseOrigin}/rest/v1/**`, async (route: Route) => {
    const request = route.request(), url = new URL(request.url()), table = url.pathname.split('/').at(-1)!
    backend.requests.push({ method: request.method(), table })
    if (table === 'v2_app_versions') { await route.fulfill({ json: [] }); return }
    if (table === 'v2_trips') {
      expect(request.method()).toBe('GET'); expect(url.searchParams.get('owner_id')).toBe(`eq.${backend.owner}`)
      const snapshot = snapshots.find((snapshot) => `eq.${snapshot.trip.slug}` === url.searchParams.get('slug'))
      await route.fulfill({ json: snapshot ? [{ id: snapshot.trip.id, slug: snapshot.trip.slug, owner_id: backend.owner }] : [] }); return
    }
    if (table === 'v2_trip_versions') {
      expect(request.method()).toBe('GET'); expect(url.searchParams.get('status')).toBe('eq.published'); expect(url.searchParams.get('is_current')).toBe('eq.true')
      const snapshot = snapshots.find((snapshot) => `eq.${snapshot.trip.id}` === url.searchParams.get('trip_id'))!
      await route.fulfill({ json: [{ trip_id: snapshot.trip.id, data_version: backend.versions.get(snapshot.trip.id) ?? `sync.${snapshot.trip.slug}.1`, schema_version: snapshot.schemaVersion, status: 'published', is_current: true, payload: snapshot }] }); return
    }
    expect(table).toBe('v2_checklist_state')
    if (backend.fail) { await route.fulfill({ status: 503, json: { message: 'PRIVATE_RAW_SERVER_ERROR' } }); return }
    if (request.method() === 'GET') {
      expect(url.searchParams.get('user_id')).toBe(`eq.${backend.owner}`)
      const tripId = url.searchParams.get('trip_id')!.slice(3)
      expect(snapshots.some((snapshot) => snapshot.trip.id === tripId)).toBe(true)
      const requestedIds = url.searchParams.get('checklist_item_id')!.slice(4,-1).split(',')
      expect(requestedIds.length).toBeLessThanOrEqual(200)
      expect(requestedIds.every((id) => itemIds(snapshots.find((snapshot) => snapshot.trip.id === tripId)!).includes(id))).toBe(true)
      backend.pulls.push(tripId)
      if (backend.gate) await backend.gate
      await route.fulfill({ json: backend.rows.filter((row) => row.user_id === backend.owner && row.trip_id === tripId && requestedIds.includes(row.checklist_item_id)) }); return
    }
    expect(request.method()).toBe('POST')
    expect(url.searchParams.get('on_conflict')).toBe('user_id,trip_id,checklist_item_id')
    expect(request.headers().prefer).toContain('resolution=merge-duplicates')
    const batch = request.postDataJSON() as any[]
    for (const row of batch) {
      expect(Object.keys(row).sort()).toEqual(['user_id','trip_id','checklist_item_id','checked','client_updated_at','device_id'].sort())
      expect(row.user_id).toBe(backend.owner); expect(snapshots.some((snapshot) => snapshot.trip.id === row.trip_id && itemIds(snapshot).includes(row.checklist_item_id))).toBe(true)
    }
    backend.batches.push(batch); backend.beforePush?.(batch)
    for (const row of batch) {
      const i = backend.rows.findIndex((old) => old.user_id === row.user_id && old.trip_id === row.trip_id && old.checklist_item_id === row.checklist_item_id)
      if (i < 0 || compareChanges({ clientUpdatedAt: row.client_updated_at, deviceId: row.device_id }, { clientUpdatedAt: backend.rows[i].client_updated_at, deviceId: backend.rows[i].device_id ?? '' }) > 0) {
        const accepted = { ...row, updated_at: new Date().toISOString() }
        if (i < 0) backend.rows.push(accepted); else backend.rows[i] = accepted
      }
    }
    await route.fulfill({ status: 201, body: '' })
  })
  await page.route(`${supabaseOrigin}/auth/v1/logout**`, (route) => route.fulfill({ status: 204 }))
  await page.route(`${supabaseOrigin}/auth/v1/token**`, (route) => route.fulfill({ json: fakeSession() }))
  return backend
}
export async function openOwned(page: Page, snapshot = syncCity) {
  await seedAuth(page); await page.goto(`#/trip/${snapshot.trip.slug}/info`)
  await expect(page.getByTestId('trip-source')).toContainText('remote')
  await expect(page.locator('.checklist-item input').first()).toBeEnabled()
}
export const checks = (page: Page) => page.locator('.checklist-item input')
export async function settings(page: Page) { await page.getByRole('navigation', { name: '主導覽' }).getByRole('link', { name: '設定', exact: true }).click() }
export async function login(page: Page) {
  await page.getByRole('textbox', { name: '電郵', exact: true }).fill('reader@example.invalid')
  await page.getByLabel('密碼', { exact: true }).fill('mock-only-password')
  await page.getByRole('button', { name: '登入', exact: true }).click()
  await expect(page.getByRole('button', { name: '登出', exact: true })).toBeVisible()
}
export async function changeAccount(page: Page, id: string) {
  const session = fakeSession(); session.user = { ...testUser, id, email: 'other@example.invalid' }
  const parts = session.access_token.split('.'); parts[1] = Buffer.from(JSON.stringify({ sub:id, role:'authenticated', exp:session.expires_at })).toString('base64url'); session.access_token = parts.join('.')
  await page.evaluate(({ key, session }) => localStorage.setItem(key, JSON.stringify(session)), { key: storageKey, session })
}
