import { z } from 'zod'
import { localTrips } from '../data/trips'
import { TRIP_SCHEMA_VERSION, validateTripSnapshot } from '../data/schema/trip'
import type { TripSnapshot, ValidationIssue } from '../data/schema/trip'
import { cacheTrip, readCachedTrip } from '../offline/tripCache'
import { supabase } from './supabase'

export type TripFailure = 'not-found' | 'auth-required' | 'unavailable' | 'invalid-data' | 'unsupported-schema'
export type LoadedTrip = { state: 'loaded'; source: 'remote' | 'cache' | 'demo'; snapshot: TripSnapshot; dataVersion: string; schemaVersion: number; cacheSaved?: boolean; fallbackReason?: TripFailure }
export type TripLoadResult = LoadedTrip | { state: 'loading' } | { state: TripFailure; issues?: ValidationIssue[] }
const tripRowSchema = z.object({ id: z.uuid(), slug: z.string(), owner_id: z.uuid() })
// Data Version is an opaque database identity; normalization could merge distinct versions.
const versionRowSchema = z.object({ trip_id: z.uuid(), data_version: z.string().min(1).refine((value) => value.trim().length > 0), schema_version: z.number().int(), status: z.literal('published'), is_current: z.literal(true), payload: z.unknown() })

export async function loadTrip(slug: string, options: { userId: string | null; signal: AbortSignal; online?: boolean }): Promise<TripLoadResult> {
  const local = localTrips.find((record) => record.payload.trip.slug === slug)
  if (local) {
    const validation = validateTripSnapshot(local.payload)
    return validation.valid
      ? { state: 'loaded', source: 'demo', snapshot: validation.snapshot, dataVersion: local.dataVersion, schemaVersion: validation.snapshot.schemaVersion }
      : { state: validation.reason, issues: validation.issues }
  }
  const { userId, signal } = options
  let cached = null
  try { cached = await readCachedTrip(slug, userId) } catch { /* Storage failures must not block remote reads. */ }
  const fallback = (state: TripFailure, issues?: ValidationIssue[]): TripLoadResult => cached
    ? { state: 'loaded', source: 'cache', snapshot: cached.payload, dataVersion: cached.dataVersion, schemaVersion: cached.schemaVersion, fallbackReason: state }
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
    const parsed = versionRowSchema.safeParse(version.data)
    if (!parsed.success || parsed.data.trip_id !== row.data.id) return fallback('invalid-data')
    if (parsed.data.schema_version !== TRIP_SCHEMA_VERSION) return fallback('unsupported-schema')
    const validation = validateTripSnapshot(parsed.data.payload)
    if (!validation.valid) return fallback(validation.reason, validation.issues)
    const snapshot = validation.snapshot
    if (snapshot.schemaVersion !== parsed.data.schema_version || snapshot.trip.slug !== slug || snapshot.trip.id !== row.data.id) return fallback('invalid-data')
    if (signal.aborted) return fallback('unavailable')
    let cacheSaved = false
    try {
      await cacheTrip({ tripId: row.data.id, slug, ownerId: userId, dataVersion: parsed.data.data_version, schemaVersion: snapshot.schemaVersion, payload: snapshot, cachedAt: new Date().toISOString() })
      cacheSaved = true
    } catch { /* A valid remote trip remains readable when device storage is unavailable. */ }
    return { state: 'loaded', source: 'remote', snapshot, dataVersion: parsed.data.data_version, schemaVersion: snapshot.schemaVersion, cacheSaved }
  } catch { return fallback('unavailable') }
}
