import type { Page } from '@playwright/test'
import { localTrips } from '../src/data/trips'
import type { TripSnapshot, Schema4Snapshot } from '../src/data/schema/trip'
import { validateTripSnapshot } from '../src/data/schema/trip'
import { expect, testUser } from './fixtures'
import { mockRemote, remoteId, remoteSlug, remoteVersion, seedAuth } from './tripFixtures'

export const cityContent = localTrips[1].payload as Schema4Snapshot
export const roadContent = localTrips[0].payload as Schema4Snapshot
export function mediaSnapshot(): Schema4Snapshot {
  const snapshot = structuredClone(roadContent)
  const cam = snapshot.liveCams[0]
  snapshot.liveCams = [
    { ...cam, id: 'embed-test', label: '虛構嵌入鏡頭', sourceType: 'embed', sourceURL: 'https://media.example.invalid/embed', officialURL: 'https://media.example.invalid/official', statusURL: 'https://media.example.invalid/status' },
    { ...cam, id: 'image-test', label: '虛構靜止畫面', sourceType: 'image', sourceURL: 'https://media.example.invalid/image.svg', officialURL: undefined, statusURL: undefined },
    { ...cam, id: 'preview-test', label: '虛構外部預覽', sourceType: 'external', sourceURL: 'https://media.example.invalid/external', previewURL: 'https://media.example.invalid/preview.svg', officialURL: undefined, statusURL: undefined },
    { ...cam, id: 'http-embed-test', label: 'HTTP 嵌入來源', sourceType: 'embed', sourceURL: 'http://media.example.invalid/embed', officialURL: undefined, statusURL: undefined },
    { ...cam, id: 'http-image-test', label: 'HTTP 圖片來源', sourceType: 'image', sourceURL: 'http://media.example.invalid/image.svg', officialURL: undefined, statusURL: undefined },
  ]
  return snapshot
}
export async function openContent(page: Page, original: TripSnapshot, view: 'attractions' | 'live', dataVersion = 'content.overview.1') {
  const snapshot = structuredClone(original)
  snapshot.trip = { ...snapshot.trip, id: remoteId, slug: remoteSlug }
  expect(validateTripSnapshot(snapshot)).toMatchObject({ valid: true })
  await seedAuth(page)
  await mockRemote(page, () => ({ ...remoteVersion(), schema_version: snapshot.schemaVersion, data_version: dataVersion, payload: snapshot }))
  await page.goto(`#/trip/${remoteSlug}/${view}`)
  await expect(page.getByTestId(view === 'live' ? 'live-cam' : 'attractions-overview')).toBeVisible()
  return snapshot
}
export async function seedContentCache(page: Page, snapshot: TripSnapshot) {
  await page.goto('#/')
  const pointer = { slug: snapshot.trip.slug, tripId: snapshot.trip.id, ownerId: testUser.id, dataVersion: 'archived.content.3' }
  const record = { ...pointer, schemaVersion: snapshot.schemaVersion, payload: snapshot, cachedAt: '2026-10-08T00:00:00Z' }
  await page.evaluate(async ({ pointer, record }) => {
    const open = indexedDB.open('travelpilot-v2-trips', 1)
    open.onupgradeneeded = () => {
      const db = open.result
      db.createObjectStore('versions', { keyPath: ['tripId', 'dataVersion'] })
      db.createObjectStore('current', { keyPath: ['slug', 'ownerId'] })
      db.createObjectStore('deviceCurrent', { keyPath: 'slug' })
    }
    const db = await new Promise<IDBDatabase>((resolve, reject) => { open.onsuccess = () => resolve(open.result); open.onerror = () => reject(open.error) })
    const tx = db.transaction(['versions', 'current', 'deviceCurrent'], 'readwrite')
    tx.objectStore('versions').put(record); tx.objectStore('current').put(pointer); tx.objectStore('deviceCurrent').put(pointer)
    await new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error) }); db.close()
  }, { pointer, record })
  return record
}
