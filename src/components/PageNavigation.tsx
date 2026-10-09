import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { pages, pageHref } from '../app/pages'
import type { PageDefinition } from '../app/pages'
import type { TripSnapshot } from '../data/schema/trip'
import { tripShortcuts } from '../data/tripPresentation'

// Page icons are shared product navigation metadata, not trip-specific artwork.
const symbols: Record<PageDefinition['id'], ReactNode> = {
  home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v12h14V9M9 21v-7h6v7" /></>,
  itinerary: <><path d="M4 5h16M4 12h16M4 19h16" /><circle cx="7" cy="5" r="1" /><circle cx="7" cy="12" r="1" /><circle cx="7" cy="19" r="1" /></>,
  info: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
  attractions: <><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z" /><circle cx="12" cy="10" r="2.5" /></>,
  live: <><rect x="3" y="6" width="13" height="12" rx="2" /><path d="m16 10 5-3v10l-5-3" /><circle cx="9.5" cy="12" r="2" /></>,
  today: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" /></>,
}
function PageIcon({ id }: { id: PageDefinition['id'] }) {
  return <svg className="page-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {symbols[id]}
  </svg>
}

export function PageNavigation({ tripSlug, snapshot }: { tripSlug?: string; snapshot?: TripSnapshot }) {
  const scope = tripSlug ? 'trip' : 'app'
  const ref = useRef<HTMLElement>(null)
  const visiblePages = scope === 'trip' && snapshot
    ? tripShortcuts(snapshot)
    : pages.filter((page) => page.scope === scope)

  useEffect(() => {
    if (scope !== 'trip') return
    const nav = ref.current
    const scroller = nav?.closest('main')
    if (!nav || !scroller) return
    const measure = () => scroller.style.setProperty('--tp-trip-nav-height', `${Math.ceil(nav.getBoundingClientRect().height)}px`)
    measure()
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
    observer?.observe(nav)
    window.addEventListener('resize', measure)
    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', measure)
      scroller.style.removeProperty('--tp-trip-nav-height')
    }
  }, [scope])

  return (
    <nav ref={ref} className={`page-navigation ${scope}-navigation`}
      aria-label={tripSlug ? '旅程頁面' : '主導覽'}>
      {visiblePages.map((page) => (
        <NavLink key={page.id} to={pageHref(page, tripSlug)} end>
          <PageIcon id={page.id} /><span>{page.title}</span>
        </NavLink>
      ))}
    </nav>
  )
}
