import type { Schema5Snapshot } from '../src/data/schema/trip'
import { todayFixture } from './todayFixtures'

type Timing = NonNullable<Schema5Snapshot['days'][number]['timeline'][number]['timing']>
export const crossZoneTiming: Timing = {
  start: { dateTime: '2025-02-05T10:00:00+08:00', timeZone: 'Asia/Hong_Kong' },
  end: { dateTime: '2025-02-05T14:30:00+09:00', timeZone: 'Asia/Tokyo' },
}
export const overnightTiming: Timing = {
  start: { dateTime: '2025-02-05T22:30:00-05:00', timeZone: 'America/New_York' },
  end: { dateTime: '2025-02-06T11:30:00Z', timeZone: 'Europe/London' },
}
// Schema 5 exists only in synthetic tests; published/local fixture versions stay intact.
export function timingFixture(timing: Timing = crossZoneTiming): Schema5Snapshot {
  const snapshot: Schema5Snapshot = { ...todayFixture(), schemaVersion: 5 }
  snapshot.days[0].timeline[0].timing = structuredClone(timing)
  // Deliberately conflicting clocks prove exact endpoints take precedence.
  snapshot.days[0].timeline[0].startTime = '18:00'
  snapshot.days[0].timeline[0].endTime = '19:00'
  return snapshot
}
