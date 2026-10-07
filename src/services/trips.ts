import { trips } from '../data/trips'

export function findTrip(slug: string | undefined) {
  return trips.find((trip) => trip.slug === slug)
}
