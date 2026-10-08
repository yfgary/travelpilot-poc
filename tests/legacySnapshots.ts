import city from './fixtures/schema1-city.json' with { type: 'json' }
import road from './fixtures/schema1-road.json' with { type: 'json' }
import { validateTripSnapshot } from '../src/data/schema/trip'

// Exact pre-Step-10 payloads, captured from Step 9 commit 71a603e.
// Keep these fixtures frozen: compatibility tests must exercise the old contract.
function readLegacy(payload: unknown) {
  const result = validateTripSnapshot(payload)
  if (!result.valid || result.snapshot.schemaVersion !== 1) throw new Error('Invalid archived Schema 1 fixture')
  return result.snapshot
}
export const legacyCity = readLegacy(city)
export const legacyRoad = readLegacy(road)
