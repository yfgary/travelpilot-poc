import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { TripSnapshot } from '../data/schema/trip'
import type { TripStatus } from '../data/tripDates'
import { formatTripDate } from '../data/tripDates'
import { resolveTripCover, tripBadgeLabel, tripShortcuts } from '../data/tripPresentation'
import { pageHref, tripPages } from '../app/pages'

const shortcutIcons = { itinerary: '▶', info: '🧳', attractions: '📍', live: '📷', today: '◷' }
interface Props {
  snapshot: TripSnapshot
  status: TripStatus
  isNext?: boolean
  recent?: boolean
  demo?: boolean
  onOpen: (slug: string) => void
}
export function TripCard({ snapshot, status, isNext = false, recent = false, demo = false, onOpen }: Props) {
  const { trip } = snapshot
  const navigate = useNavigate()
  const cover = resolveTripCover(snapshot, import.meta.env.BASE_URL)
  const [failedURL, setFailedURL] = useState<string | null>(null)
  const showImage = cover && cover.url !== failedURL
  const href = pageHref(tripPages.find((page) => page.id === 'itinerary')!, trip.slug)
  const remember = () => onOpen(trip.slug)
  return (
    <article className={`trip-card${status === 'completed' ? ' is-completed' : ''}${recent ? ' is-recent' : ''}`}>
      {/* The main surface is a real link; shortcut links are siblings, never nested. */}
      <Link className="trip-card-main" to={href} aria-label={`開啟 ${trip.title}`} onClick={remember} onKeyDown={(event) => {
        if (event.key === ' ') { event.preventDefault(); remember(); navigate(href) }
      }}>
        <div className={`trip-cover${showImage ? '' : ' trip-cover-fallback'}`} data-testid="trip-cover">
          {showImage ? <img src={cover.url} alt={cover.alt} onError={() => setFailedURL(cover.url)} /> :
            <span className="cover-art" aria-hidden="true"><span className="cover-orbit" /><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="25" /><path d="m42 22-7 13-13 7 7-13Z" /></svg></span>}
          <div className="trip-badges">
            {demo && <span className="cover-badge badge-demo">示範資料</span>}
            <span className={`cover-badge badge-${status}`} data-testid="trip-status">{tripBadgeLabel(status, isNext)}</span>
            {recent && <span className="cover-badge badge-recent">最近使用</span>}
          </div>
          <div className="cover-caption"><small>{!showImage && '非目的地示意設計'}</small><span>{trip.destinationLabel}</span></div>
        </div>
        <div className="trip-card-body">
          <h3>{trip.title}</h3>
          <p className="trip-card-summary">{trip.summary}</p>
          <p className="trip-card-dates"><time dateTime={trip.startDate}>{formatTripDate(trip.startDate)}</time><span aria-hidden="true"> – </span><time dateTime={trip.endDate}>{formatTripDate(trip.endDate)}</time></p>
        </div>
      </Link>
      <div className="trip-card-actions" aria-label={`${trip.title}快捷連結`}>
        {tripShortcuts(snapshot).map((page) => <Link key={page.id} className={`trip-shortcut${page.id === 'itinerary' ? ' shortcut-primary' : ''}`}
          to={pageHref(page, trip.slug)} onClick={remember}>
          <span aria-hidden="true">{shortcutIcons[page.id]}</span>{page.id === 'attractions' ? '景點' : page.title}
        </Link>)}
      </div>
    </article>
  )
}
