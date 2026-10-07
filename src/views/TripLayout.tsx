import { Outlet, useParams } from 'react-router-dom'
import { findTrip } from '../services/trips'
import { NotFound } from './NotFound'
import { PageNavigation } from '../components/PageNavigation'

export function TripLayout() {
  const { tripSlug } = useParams<{ tripSlug: string }>()
  const trip = findTrip(tripSlug)
  if (!trip) return <NotFound trip />

  return (
    <>
      <section className="trip-heading">
        <p className="eyebrow">你的旅程</p>
        <h2>{trip.title}</h2>
        <p>{trip.summary}</p>
        <p className="trip-identifier">旅程識別碼：<code>{tripSlug}</code></p>
        <PageNavigation tripSlug={trip.slug} />
      </section>
      <Outlet context={trip} />
    </>
  )
}
