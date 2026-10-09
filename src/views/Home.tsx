import { branding } from '../app/metadata'
import { useHomeTrips } from '../app/useHomeTrips'
import { orderTrips } from '../data/tripDates'
import { nextUpcomingSlug } from '../data/tripPresentation'
import { useRecentTrip } from '../app/useRecentTrip'
import { TripCard } from '../components/TripCard'
import { EmptyState } from '../components/ViewState'
import '../styles/home.css'

export function Home() {
  const { recentSlug, rememberTrip } = useRecentTrip()
  const listing = useHomeTrips()
  const ordered = orderTrips(listing.trips)
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
        {listing.loading && <p className="muted" data-testid="trip-list-loading">正在載入已儲存及帳戶旅程…</p>}
        {listing.unavailable && <p className="muted">暫時未能更新帳戶旅程；已儲存的旅程仍可使用。</p>}
        {!!listing.rejected && <p className="muted">部分旅程資料未能通過驗證，其他旅程仍可使用。</p>}
        {listing.storageUnavailable && <p className="muted">此裝置暫時未能儲存或讀取離線旅程。</p>}
        <div className="trip-list">
          {ordered.map(({ trip, status }) => (
            <TripCard key={trip.slug} snapshot={trip.snapshot} status={status} isNext={trip.slug === nextSlug}
              recent={recentSlug === trip.slug} demo={trip.demo} onOpen={rememberTrip} />
          ))}
        </div>
        {ordered.length === 0 && <EmptyState title="未有旅程" description="旅程加入後會在這裏顯示。" />}
      </section>
    </div>
  )
}
