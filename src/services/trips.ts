import { z } from 'zod'
import { localTrips } from '../data/trips'
import { isSupportedTripSchemaVersion, validateTripSnapshot } from '../data/schema/trip'
import type { TripSnapshot, ValidationIssue } from '../data/schema/trip'
import { cacheTrip, readCachedTrip, listCachedTrips } from '../offline/tripCache'
import { supabase } from './supabase'

export type TripFailure = 'not-found' | 'auth-required' | 'unavailable' | 'invalid-data' | 'unsupported-schema'
export type LoadedTrip = { state: 'loaded'; source: 'remote' | 'cache' | 'demo'; ownerId: string | null; snapshot: TripSnapshot; dataVersion: string; schemaVersion: TripSnapshot['schemaVersion']; cacheSaved?: boolean; fallbackReason?: TripFailure }
export type TripLoadResult = LoadedTrip | { state: 'loading' } | { state: TripFailure; issues?: ValidationIssue[] }
const tripRowSchema = z.object({ id: z.uuid(), slug: z.string(), owner_id: z.uuid() })
// Data Version is an opaque database identity; normalization could merge distinct versions.
const versionRowSchema = z.object({ trip_id: z.uuid(), data_version: z.string().min(1).refine((value) => value.trim().length > 0), schema_version: z.number().int(), status: z.literal('published'), is_current: z.literal(true), payload: z.unknown() })

export async function loadTrip(slug: string, options: { userId: string | null; signal: AbortSignal; online?: boolean }): Promise<TripLoadResult> {
  const local = localTrips.find((record) => record.payload.trip.slug === slug)
  if (local) {
    const validation = validateTripSnapshot(local.payload)
    return validation.valid
      ? { state: 'loaded', source: 'demo', ownerId: null, snapshot: validation.snapshot, dataVersion: local.dataVersion, schemaVersion: validation.snapshot.schemaVersion }
      : { state: validation.reason, issues: validation.issues }
  }
  const { userId, signal } = options
  let cached = null
  try { cached = await readCachedTrip(slug, userId) } catch { /* Storage failures must not block remote reads. */ }
  const fallback = (state: TripFailure, issues?: ValidationIssue[]): TripLoadResult => cached
    ? { state: 'loaded', source: 'cache', ownerId: cached.ownerId, snapshot: cached.payload, dataVersion: cached.dataVersion, schemaVersion: cached.payload.schemaVersion, fallbackReason: state }
    : { state, issues }
  if (options.online === false) return fallback('unavailable')
  if (!userId) return fallback('auth-required')
  try {
    const trip = await supabase.from('v2_trips').select('id,slug,owner_id').eq('slug', slug).eq('owner_id', userId).retry(false).abortSignal(signal).maybeSingle()
    if (trip.error) return fallback(trip.status === 401 || trip.status === 403 ? 'auth-required' : 'unavailable')
    if (!trip.data) return fallback('not-found')
    const row = tripRowSchema.safeParse(trip.data)
    if (!row.success || row.data.slug !== slug || row.data.owner_id !== userId) return fallback('invalid-data')
    const version = await supabase.from('v2_trip_versions').select('trip_id,data_version,schema_version,status,is_current,payload')
      .eq('trip_id', row.data.id).eq('status', 'published').eq('is_current', true).retry(false).abortSignal(signal).maybeSingle()
    if (version.error) return fallback(version.status === 401 || version.status === 403 ? 'auth-required' : 'unavailable')
    if (!version.data) return fallback('not-found')
    const validated = validateRemoteTrip(row.data, version.data, userId)
    if (validated.state !== 'loaded') return fallback(validated.state, validated.issues)
    const { snapshot, dataVersion } = validated
    if (signal.aborted) return fallback('unavailable')
    let cacheSaved = false
    try {
      await cacheTrip({ tripId: row.data.id, slug, ownerId: userId, dataVersion, schemaVersion: snapshot.schemaVersion, payload: snapshot, cachedAt: new Date().toISOString() })
      cacheSaved = true
    } catch { /* A valid remote trip remains readable when device storage is unavailable. */ }
    return { state: 'loaded', source: 'remote', ownerId: userId, snapshot, dataVersion, schemaVersion: snapshot.schemaVersion, cacheSaved }
  } catch { return fallback('unavailable') }
}

// Both the route loader and Home listing share row, ownership and payload validation.
export function validateRemoteTrip(tripRow: unknown, versionRow: unknown, ownerId: string): LoadedTrip | { state: TripFailure; issues?: ValidationIssue[] } {
  const trip = tripRowSchema.safeParse(tripRow), version = versionRowSchema.safeParse(versionRow)
  if (!trip.success || trip.data.owner_id !== ownerId || !version.success || version.data.trip_id !== trip.data.id) return { state: 'invalid-data' }
  if (!isSupportedTripSchemaVersion(version.data.schema_version)) return { state: 'unsupported-schema' }
  const result = validateTripSnapshot(version.data.payload)
  if (!result.valid) return { state: result.reason, issues: result.issues }
  if (result.snapshot.schemaVersion !== version.data.schema_version || result.snapshot.trip.id !== trip.data.id || result.snapshot.trip.slug !== trip.data.slug) return { state: 'invalid-data' }
  return { state: 'loaded', source: 'remote', ownerId, snapshot: result.snapshot, dataVersion: version.data.data_version, schemaVersion: result.snapshot.schemaVersion }
}

export type TripListResult = { trips: LoadedTrip[]; unavailable: boolean; rejected: number; storageUnavailable: boolean }
export async function listTrips(options: { userId: string | null; online: boolean; signal: AbortSignal }): Promise<TripListResult> {
  const { userId, signal } = options
  const records = new Map<string, LoadedTrip>()
  let storageUnavailable = false, unavailable = false, rejected = 0
  try {
    for (const record of await listCachedTrips(userId)) records.set(record.slug, { state: 'loaded', source: 'cache', ownerId: record.ownerId, snapshot: record.payload, dataVersion: record.dataVersion, schemaVersion: record.payload.schemaVersion })
  } catch { storageUnavailable = true }
  if (userId && options.online && !signal.aborted) {
    try {
      // Stable pagination avoids the server's row limit; versions are fetched in batches, not per trip.
      const rows: z.infer<typeof tripRowSchema>[] = []
      for (let offset = 0; ; offset += 100) {
        const response = await supabase.from('v2_trips').select('id,slug,owner_id').eq('owner_id', userId).order('id').range(offset, offset + 99).retry(false).abortSignal(signal)
        if (response.error || !Array.isArray(response.data)) throw new Error('Trip listing unavailable')
        for (const raw of response.data) {
          const row = tripRowSchema.safeParse(raw)
          if (!row.success || row.data.owner_id !== userId || rows.some((other) => other.id === row.data.id || other.slug === row.data.slug)) { rejected++; continue }
          rows.push(row.data)
        }
        if (response.data.length < 100) break
      }
      for (let index = 0; index < rows.length; index += 100) {
        const batch = rows.slice(index, index + 100), versions: unknown[] = []
        for (let offset = 0; ; offset += 100) {
          const response = await supabase.from('v2_trip_versions').select('trip_id,data_version,schema_version,status,is_current,payload').in('trip_id', batch.map((row) => row.id)).eq('status', 'published').eq('is_current', true).order('trip_id').range(offset, offset + 99).retry(false).abortSignal(signal)
          if (response.error || !Array.isArray(response.data)) throw new Error('Version listing unavailable')
          versions.push(...response.data)
          if (response.data.length < 100) break
        }
        for (const row of batch) {
          const matches = versions.filter((raw) => raw !== null && typeof raw === 'object' && 'trip_id' in raw && raw.trip_id === row.id)
          if (!matches.length) continue
          const result = matches.length === 1 ? validateRemoteTrip(row, matches[0], userId) : { state: 'invalid-data' as const }
          if (result.state !== 'loaded') { rejected++; continue }
          if (signal.aborted) throw new Error('Listing cancelled')
          try {
            await cacheTrip({ tripId: row.id, slug: row.slug, ownerId: userId, dataVersion: result.dataVersion, schemaVersion: result.schemaVersion, payload: result.snapshot, cachedAt: new Date().toISOString() })
          } catch { storageUnavailable = true }
          records.set(row.slug, result)
        }
      }
    } catch { unavailable = true }
  }
  // Local fixture slugs retain their route identity; adding real trips never changes this registry.
  for (const record of localTrips) {
    const result = validateTripSnapshot(record.payload)
    if (result.valid) records.set(result.snapshot.trip.slug, { state: 'loaded', source: 'demo', ownerId: null, snapshot: result.snapshot, dataVersion: record.dataVersion, schemaVersion: result.snapshot.schemaVersion })
  }
  return { trips: [...records.values()], unavailable, rejected, storageUnavailable }
}
