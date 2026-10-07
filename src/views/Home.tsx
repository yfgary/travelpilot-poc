import { Link } from 'react-router-dom'
import { branding } from '../app/metadata'
import { trips } from '../data/trips'

export function Home() {
  return (
    <>
      <img className="home-banner" src={branding.banner} alt="TravelPilot 旅程管家" />
      <h1>每一段旅程，都準備妥當。</h1>
      <p>行程、景點、天氣與旅途資訊，一站管理。</p>
      <div className="trip-list">
        {trips.map((trip) => (
          <article className="panel" key={trip.slug}>
            <h2>{trip.title}</h2>
            <p>{trip.summary}</p>
            <Link to={`/trip/${encodeURIComponent(trip.slug)}/itinerary`}>開啟旅程</Link>
          </article>
        ))}
      </div>
    </>
  )
}
