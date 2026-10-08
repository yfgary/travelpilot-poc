import type { TripSnapshot } from './schema/trip'
import type { TripStatus } from './tripDates'
import { tripStatusLabels } from './tripDates'
import { tripPages } from '../app/pages'

export function tripBadgeLabel(status: TripStatus, isNext: boolean): string {
  return status === 'upcoming' && isNext ? '下一趟旅程' : tripStatusLabels[status]
}

// Input is the already date-sorted list. Recent use never participates in sorting.
export function nextUpcomingSlug(ordered: { trip: { slug: string }; status: TripStatus }[]): string | undefined {
  return ordered.find(({ status }) => status === 'upcoming')?.trip.slug
}

export function tripShortcuts(snapshot: TripSnapshot) {
  return tripPages.filter((page) =>
    (page.id !== 'live' || snapshot.liveCams.length > 0) &&
    (page.id !== 'attractions' || snapshot.places.length > 0))
}

export function resolveTripCover(snapshot: TripSnapshot, baseURL = '/') {
  for (const id of [snapshot.trip.heroImageId, snapshot.trip.bannerImageId]) {
    const image = snapshot.images.find((image) => image.id === id)
    if (!image) continue
    // Product-brand artwork cannot become a destination image, even through bad data.
    try {
      const path = decodeURIComponent(new URL(image.url, 'https://assets.invalid/').pathname)
      if (/\/travelpilot_banner\.PNG$/i.test(path)) continue
    } catch { continue }
    if (!image.url || /^(?!https?:)[a-z]+:/i.test(image.url) || image.url.startsWith('/')) continue
    return { ...image, url: /^https?:\/\//.test(image.url) ? image.url : `${baseURL}${image.url}` }
  }
  return null
}
