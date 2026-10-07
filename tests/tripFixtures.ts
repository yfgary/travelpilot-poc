import type { Page } from '@playwright/test'
import { localTrips } from '../src/data/trips'
import { storageKey, fakeSession, testUser, supabaseOrigin } from './fixtures'
export const remoteId = '00000000-0000-4000-8000-000000000002'
export const remoteSlug = 'sample-journey'
export function remoteSnapshot() {
  const snapshot = structuredClone(localTrips[0].payload)
  snapshot.trip = { ...snapshot.trip, id: remoteId, slug: remoteSlug, title: '通用遠端測試旅程' }
  return snapshot
}
export function remoteVersion() {
  return { trip_id: remoteId, data_version: 'content.1', schema_version: 1, status: 'published', is_current: true, payload: remoteSnapshot() }
}
export async function seedAuth(page: Page) {
  await page.addInitScript(({ key, session }) => {
    if (!sessionStorage.getItem('test-auth-seeded')) {
      localStorage.setItem(key, JSON.stringify(session))
      sessionStorage.setItem('test-auth-seeded', 'true')
    }
  }, { key: storageKey, session: fakeSession() })
}
export async function mockRemote(page: Page, getVersion = remoteVersion) {
  await page.route(`${supabaseOrigin}/rest/v1/v2_trips**`, (route) => route.fulfill({ json: [{ id: remoteId, slug: remoteSlug, owner_id: testUser.id }] }))
  await page.route(`${supabaseOrigin}/rest/v1/v2_trip_versions**`, (route) => route.fulfill({ json: [getVersion()] }))
}
export async function cacheContents(page: Page) {
  return page.evaluate(async () => {
    const request = indexedDB.open('travelpilot-v2-trips', 1)
    const db = await new Promise<IDBDatabase>((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error) })
    try {
      const read = (name: string) => new Promise<unknown[]>((resolve, reject) => {
        const request = db.transaction(name).objectStore(name).getAll()
        request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error)
      })
      return { versions: await read('versions'), pointers: await read('current'), device: await read('deviceCurrent') }
    } finally { db.close() }
  })
}
