import { WeatherPanel } from '../components/weather/WeatherPanel'
import { useParams } from 'react-router-dom'
import { useLoadedTrip } from '../app/TripContext'
import { PageHeading } from '../components/PageHeading'
import { EmptyState } from '../components/ViewState'

export function TripView({ title, showWeather = false }: { title: string; showWeather?: boolean }) {
  const { tripSlug } = useParams<{ tripSlug: string }>()
  const { snapshot: { trip } } = useLoadedTrip()
  return (
    <>
    <section className="panel">
      <PageHeading title={title} description={`${trip.title}（${tripSlug}）`} />
      <EmptyState title="內容準備中" description="此頁面已準備就緒，內容將於後續階段加入。" />
    </section>
    {showWeather && <WeatherPanel />}
    </>
  )
}
