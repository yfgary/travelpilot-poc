import type { Page } from '@playwright/test'
import { legacyCity as cityTrip, legacyRoad as roadTrip } from './legacySnapshots'
import { supabaseOrigin, testUser } from './fixtures'

export function remoteTrips() {
  return [
    { payload: structuredClone(cityTrip), id: '00000000-0000-4000-8000-000000000010', slug: 'remote-city-trip', title: '遠端城市示範旅程', dataVersion: 'remote.city.1' },
    { payload: structuredClone(roadTrip), id: '00000000-0000-4000-8000-000000000011', slug: 'remote-road-trip', title: '遠端山區示範旅程', dataVersion: 'remote.road.1' },
  ].map((record) => ({ ...record, payload: { ...record.payload, trip: { ...record.payload.trip, id: record.id, slug: record.slug, title: record.title } } }))
}

export async function mockRemoteTrips(page: Page, records = remoteTrips()) {
  const requests: { table: string; slug: string }[] = []
  for (const table of ['v2_trips', 'v2_trip_versions']) {
    await page.route(`${supabaseOrigin}/rest/v1/${table}**`, async (route) => {
      const request = route.request(), params = new URL(request.url()).searchParams
      if (request.method() !== 'GET') throw new Error('Trip content must be read-only')
      const record = table === 'v2_trips'
        ? records.find((record) => params.get('slug') === `eq.${record.slug}`)
        : records.find((record) => params.get('trip_id') === `eq.${record.id}`)
      if (table === 'v2_trips' && params.get('owner_id') !== `eq.${testUser.id}`) throw new Error('Missing ownership filter')
      if (table === 'v2_trip_versions' && (params.get('status') !== 'eq.published' || params.get('is_current') !== 'eq.true')) throw new Error('Missing current published filters')
      requests.push({ table, slug: record?.slug ?? 'unknown' })
      await route.fulfill({ json: record ? [table === 'v2_trips'
        ? { id: record.id, slug: record.slug, owner_id: testUser.id }
        : { trip_id: record.id, data_version: record.dataVersion, schema_version: 1, status: 'published', is_current: true, payload: record.payload }] : [] })
    })
  }
  return requests
}
