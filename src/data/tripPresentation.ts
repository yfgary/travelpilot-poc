import type { TripSnapshot } from './schema/trip'
import type { TripStatus } from './tripDates'
import { tripStatusLabels } from './tripDates'
import { tripPages } from '../app/pages'\nimport type { PageDefinition } from '../app/pages'
import { resolveContentImage } from './images'

export function tripBadgeLabel(status: TripStatus, isNext: boolean): string {
  return status === 'upcoming' && isNext ? '下一趟旅程' : tripStatusLabels[status]
}

// Input is the already date-sorted list. Recent use never participates in sorting.
export function nextUpcomingSlug(ordered: { trip: { slug: string }; status: TripStatus }[]): string | undefined {
  return ordered.find(({ status }) => status === 'upcoming')?.trip.slug
}

export function isTripPageAvailable(snapshot: TripSnapshot, page: PageDefinition): boolean {
  if (page.scope !== 'trip') return true
  if (page.id === 'live') return snapshot.liveCams.length > 0
  if (page.id === 'attractions') return snapshot.places.length > 0
  return true
}

export function tripShortcuts(snapshot: TripSnapshot) {
  return tripPages.filter((page) => isTripPageAvailable(snapshot, page))
}

export function resolveTripCover(snapshot: TripSnapshot, baseURL = '/') {
  for (const id of [snapshot.trip.heroImageId, snapshot.trip.bannerImageId]) {
    const image = resolveContentImage(snapshot.images.find((image) => image.id === id), baseURL)
    if (image) return image
  }
  return null
}
