import { Link } from 'react-router-dom'
import { branding } from '../app/metadata'
import { pages, pageHref } from '../app/pages'
import { trips } from '../data/trips'
import { EmptyState } from '../components/ViewState'

export function Home() {
  const itinerary = pages.find((page) => page.id === 'itinerary')!
  return (
    <>
      <section className="home-hero">
        <img className="home-banner" src={branding.banner} alt="TravelPilot 旅程管家" />
        <div className="hero-copy">
          <p className="eyebrow">TravelPilot｜旅程管家</p>
          <h1>每一段旅程，都準備妥當。</h1>
          <p>行程、景點、天氣與旅途資訊，一站管理。</p>
        </div>
      </section>
      <section className="panel" aria-labelledby="trips-title">
        <div className="section-heading"><h2 id="trips-title">我的旅程</h2><span className="muted">{trips.length} 個旅程</span></div>
        <div className="trip-list">
          {trips.map((trip) => (
            <article className="trip-card" key={trip.slug}>
              <span className="badge">示範資料</span>
              <h3>{trip.title}</h3>
              <p>{trip.summary}</p>
              <Link className="button" to={pageHref(itinerary, trip.slug)}>開啟旅程 <span aria-hidden="true">→</span></Link>
            </article>
          ))}
        </div>
        {trips.length === 0 && <EmptyState title="未有旅程" description="旅程加入後會在這裏顯示。" />}
      </section>
    </>
  )
}
