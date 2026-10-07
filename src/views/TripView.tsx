import { useOutletContext, useParams } from 'react-router-dom'
import type { TripSummary } from '../data/schema/trip'

export function TripView({ title }: { title: string }) {
  const { tripSlug } = useParams<{ tripSlug: string }>()
  const trip = useOutletContext<TripSummary>()
  return (
    <section className="panel" aria-labelledby="view-title">
      <h1 id="view-title">{title}</h1>
      <p>{trip.title}（{tripSlug}）</p>
      <p>此頁面已準備就緒，內容將於後續階段加入。</p>
    </section>
  )
}
