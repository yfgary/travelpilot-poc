import { branding } from '../app/metadata'
import { localTrips } from '../data/trips'
import { orderTrips } from '../data/tripDates'
import { nextUpcomingSlug } from '../data/tripPresentation'
import { useRecentTrip } from '../app/useRecentTrip'
import { TripCard } from '../components/TripCard'
import { EmptyState } from '../components/ViewState'
import '../styles/home.css'

export function Home() {
  const { recentSlug, rememberTrip } = useRecentTrip()
  const ordered = orderTrips(localTrips.map(({ payload }) => ({ ...payload.trip, snapshot: payload })))
  const nextSlug = nextUpcomingSlug(ordered)
  return (
    <div className="home-page">
      <section className="home-hero">
        <img className="home-banner" src={branding.banner} alt="TravelPilot 旅程管家" />
        <div className="hero-copy">
          <p className="eyebrow">TravelPilot｜旅程管家</p>
          <h1>每一段旅程，都準備妥當。</h1>
          <p>行程、景點、天氣與旅途資訊，一站管理。</p>
        </div>
      </section>
      <section className="panel home-trips" aria-labelledby="trips-title">
        <div className="section-heading"><div><p className="trips-kicker">MY TRIPS</p><h2 id="trips-title">我的旅程</h2></div><span className="trip-count">{ordered.length} 個旅程</span></div>
        <div className="trip-list">
          {ordered.map(({ trip, status }) => (
            <TripCard key={trip.slug} snapshot={trip.snapshot} status={status} isNext={trip.slug === nextSlug}
              recent={recentSlug === trip.slug} demo onOpen={rememberTrip} />
          ))}
        </div>
        {ordered.length === 0 && <EmptyState title="未有旅程" description="旅程加入後會在這裏顯示。" />}
      </section>
    </div>
  )
}
