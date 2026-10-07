import { NavLink, Outlet, useParams } from 'react-router-dom'
import { findTrip } from '../services/trips'
import { NotFound } from './NotFound'
import { tripViews } from './tripViews'
import type { TripSummary } from '../data/schema/trip'

export function TripLayout() {
  const { tripSlug } = useParams<{ tripSlug: string }>()
  const trip = findTrip(tripSlug)
  if (!trip) return <NotFound trip />

  return (
    <>
      <h2>{trip.title}</h2>
      <p>{trip.summary}</p>
      <p>旅程識別碼：<code>{tripSlug}</code></p>
      <nav className="trip-navigation" aria-label="旅程頁面">
        {tripViews.map((view) => (
          <NavLink key={view.path} to={`/trip/${encodeURIComponent(trip.slug)}/${view.path}`}>
            {view.title}
          </NavLink>
        ))}
      </nav>
      <Outlet context={trip satisfies TripSummary} />
    </>
  )
}
