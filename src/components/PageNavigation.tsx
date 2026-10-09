import { NavLink } from 'react-router-dom'
import { pages, pageHref } from '../app/pages'
import type { TripSnapshot } from '../data/schema/trip'
import { tripShortcuts } from '../data/tripPresentation'

export function PageNavigation({ tripSlug, snapshot }: { tripSlug?: string; snapshot?: TripSnapshot }) {
  const scope = tripSlug ? 'trip' : 'app'
  const visiblePages = scope === 'trip' && snapshot
    ? tripShortcuts(snapshot)
    : pages.filter((page) => page.scope === scope)
  return (
    <nav className={`page-navigation ${scope}-navigation`} aria-label={tripSlug ? '旅程頁面' : '主導覽'}>
      {visiblePages.map((page) => (
        <NavLink key={page.id} to={pageHref(page, tripSlug)} end>
          {page.title}
        </NavLink>
      ))}
    </nav>
  )
}
