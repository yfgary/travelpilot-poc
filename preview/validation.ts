import { validateTripSnapshot } from '../src/data/schema/trip'
export interface InputIdentity { sha256: string; schemaVersion: number; tripId: string; slug: string; dataVersion: string }
export interface PreviewInput extends InputIdentity { raw: string }
// The input bytes are never corrected, reserialized or replaced with published data.
export function validatePreviewInput(input: PreviewInput, actualDigest: string) {
  if (actualDigest !== input.sha256 || !/^[a-f0-9]{64}$/.test(input.sha256)) throw new Error('Preview SHA256 mismatch')
  const result = validateTripSnapshot(JSON.parse(input.raw))
  if (!result.valid) throw new Error(`Preview validation failed: ${JSON.stringify(result.issues)}`)
  if (result.snapshot.schemaVersion !== input.schemaVersion || result.snapshot.trip.id !== input.tripId || result.snapshot.trip.slug !== input.slug || !input.dataVersion) throw new Error('Preview identity mismatch')
  return result.snapshot
}
