import { useOutletContext, useParams } from 'react-router-dom'
import type { TripSummary } from '../data/schema/trip'
import { PageHeading } from '../components/PageHeading'
import { EmptyState } from '../components/ViewState'

export function TripView({ title }: { title: string }) {
  const { tripSlug } = useParams<{ tripSlug: string }>()
  const trip = useOutletContext<TripSummary>()
  return (
    <section className="panel">
      <PageHeading title={title} description={`${trip.title}（${tripSlug}）`} />
      <EmptyState title="內容準備中" description="此頁面已準備就緒，內容將於後續階段加入。" />
    </section>
  )
}
