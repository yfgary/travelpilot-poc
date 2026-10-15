import input from 'virtual:preview-input'
import { localTrips } from '../src/data/trips'
import { validateTripSnapshot } from '../src/data/schema/trip'
import type { LoadedTrip as NormalLoadedTrip, TripLoadResult as NormalResult } from '../src/services/trips'
import { validatePreviewInput } from './validation'
// Provenance is extended only in the isolated build, never confused with remote publication.
export type LoadedTrip = Omit<NormalLoadedTrip, 'source'> & { source: 'demo' | 'preview' }
export type TripLoadResult = LoadedTrip | Exclude<NormalResult, NormalLoadedTrip>
export type TripListResult = { trips: LoadedTrip[]; unavailable: boolean; rejected: number; storageUnavailable: boolean }
let records: LoadedTrip[] | undefined
export async function initializePreview() {
  if (!__ISOLATED_PREVIEW__) throw new Error('Explicit Preview build required')
  const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input.raw))), byte => byte.toString(16).padStart(2, '0')).join('')
  const snapshot = validatePreviewInput(input, digest)
  const demos: LoadedTrip[] = localTrips.map(record => {
    const result = validateTripSnapshot(record.payload)
    if (!result.valid) throw new Error('Invalid Preview demo')
    return { state: 'loaded', source: 'demo', ownerId: null, snapshot: result.snapshot, dataVersion: record.dataVersion, schemaVersion: result.snapshot.schemaVersion }
  })
  records = [...demos, { state: 'loaded', source: 'preview', ownerId: null, snapshot, dataVersion: input.dataVersion, schemaVersion: snapshot.schemaVersion }]
  if (new Set(records.map(record => record.snapshot.trip.slug)).size !== records.length) { records = undefined; throw new Error('Duplicate Preview identity') }
}
function registry() {
  if (!records) throw new Error('Preview validation has not completed')
  return structuredClone(records)
}
export async function loadTrip(slug: string): Promise<TripLoadResult> {
  return registry().find(record => record.snapshot.trip.slug === slug) ?? { state: 'not-found' }
}
export async function listTrips(): Promise<TripListResult> {
  return { trips: registry(), unavailable: false, rejected: 0, storageUnavailable: false }
}
export const previewMetadata = { dataVersion: input.dataVersion, schemaVersion: input.schemaVersion, sha256: input.sha256 }
