import { cityTrip } from './demoTrips/cityTrip'
import { roadTrip } from './demoTrips/roadTrip'

// Deliberately completed-before-upcoming: Home must sort instead of using fixture order.
// Adding a fixture means adding a data record; the shared loader validates each by slug.
export const localTrips = [
  { payload: roadTrip, dataVersion: 'demo.road.5' },
  { payload: cityTrip, dataVersion: 'demo.city.5' },
]
export const trips = localTrips.map(({ payload }) => payload.trip)
