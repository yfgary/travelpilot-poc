import { openDB } from 'idb'
import type { DBSchema } from 'idb'
import { isSupportedTripSchemaVersion, validateTripSnapshot } from '../data/schema/trip'
import type { TripSnapshot } from '../data/schema/trip'

export type CachedTrip = {
  tripId: string; slug: string; ownerId: string; dataVersion: string; schemaVersion: number; payload: TripSnapshot; cachedAt: string
}
type Pointer = Pick<CachedTrip, 'tripId' | 'slug' | 'ownerId' | 'dataVersion'>
interface TripDB extends DBSchema {
  versions: { key: [string, string]; value: CachedTrip }
  current: { key: [string, string]; value: Pointer }
  deviceCurrent: { key: string; value: Pointer }
}
export const TRIP_CACHE_DATABASE = 'travelpilot-v2-trips'
const database = () => openDB<TripDB>(TRIP_CACHE_DATABASE, 1, {
  upgrade(db) {
    db.createObjectStore('versions', { keyPath: ['tripId', 'dataVersion'] })
    db.createObjectStore('current', { keyPath: ['slug', 'ownerId'] })
    db.createObjectStore('deviceCurrent', { keyPath: 'slug' })
  },
  blocking(_currentVersion, _blockedVersion, event) { (event.target as IDBDatabase).close() },
})

export async function cacheTrip(record: CachedTrip): Promise<void> {
  const validation = validateTripSnapshot(record.payload)
  if (!validation.valid || record.schemaVersion !== validation.snapshot.schemaVersion || record.tripId !== validation.snapshot.trip.id || record.slug !== validation.snapshot.trip.slug || !record.dataVersion.trim() || !record.ownerId) throw new Error('Invalid trip cache record')
  const db = await database()
  try {
    const tx = db.transaction(['versions', 'current', 'deviceCurrent'], 'readwrite')
    const pointer: Pointer = { slug: record.slug, ownerId: record.ownerId, tripId: record.tripId, dataVersion: record.dataVersion }
    await Promise.all([
      tx.objectStore('versions').put({ ...record, payload: validation.snapshot }),
      tx.objectStore('current').put(pointer),
      tx.objectStore('deviceCurrent').put(pointer),
      tx.done,
    ])
  } finally { db.close() }
}

export async function readCachedTrip(slug: string, ownerId: string | null): Promise<CachedTrip | null> {
  const db = await database()
  try {
    const pointer = ownerId ? await db.get('current', [slug, ownerId]) : await db.get('deviceCurrent', slug)
    if (!pointer || pointer.slug !== slug || (ownerId && pointer.ownerId !== ownerId)) return null
    const record = await db.get('versions', [pointer.tripId, pointer.dataVersion])
    if (!record || record.tripId !== pointer.tripId || record.dataVersion !== pointer.dataVersion || record.ownerId !== pointer.ownerId || record.slug !== slug || !isSupportedTripSchemaVersion(record.schemaVersion) || !record.dataVersion.trim()) return null
    const validation = validateTripSnapshot(record.payload)
    if (!validation.valid || validation.snapshot.schemaVersion !== record.schemaVersion || validation.snapshot.trip.id !== record.tripId || validation.snapshot.trip.slug !== slug) return null
    return { ...record, payload: validation.snapshot }
  } finally { db.close() }
}

// Inspect only current, validated pointers. No cache rewrite/migration on read.
export async function listCachedTrips(ownerId: string | null): Promise<CachedTrip[]> {
  const db = await database()
  let pointers: Pointer[]
  try { pointers = ownerId ? (await db.getAll('current')).filter((pointer) => pointer.ownerId === ownerId) : await db.getAll('deviceCurrent') }
  finally { db.close() }
  const records = await Promise.all(pointers.map((pointer) => readCachedTrip(pointer.slug, ownerId)))
  return records.filter((record): record is CachedTrip => record !== null).sort((a, b) => a.slug.localeCompare(b.slug, 'en'))
}
export async function clearTripCache(): Promise<void> {
  const db = await database()
  try {
    const tx = db.transaction(['versions', 'current', 'deviceCurrent'], 'readwrite')
    await Promise.all([tx.objectStore('versions').clear(), tx.objectStore('current').clear(), tx.objectStore('deviceCurrent').clear(), tx.done])
  } finally { db.close() }
}
