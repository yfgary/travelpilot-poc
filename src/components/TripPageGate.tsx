import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useLoadedTrip } from '../app/TripContext'
import { pageHref, tripPages } from '../app/pages'
import type { PageDefinition } from '../app/pages'
import { isTripPageAvailable } from '../data/tripPresentation'

const itineraryPage = tripPages.find((page) => page.id === 'itinerary')!

export function TripPageGate({ page, children }: { page: PageDefinition; children: ReactNode }) {
  const { snapshot } = useLoadedTrip()
  if (isTripPageAvailable(snapshot, page)) return <>{children}</>
  return <Navigate to={pageHref(itineraryPage, snapshot.trip.slug)} replace />
}
