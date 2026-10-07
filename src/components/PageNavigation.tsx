import { NavLink } from 'react-router-dom'
import { pages, pageHref } from '../app/pages'

export function PageNavigation({ tripSlug }: { tripSlug?: string }) {
  const scope = tripSlug ? 'trip' : 'app'
  return (
    <nav className={`page-navigation ${scope}-navigation`} aria-label={tripSlug ? '旅程頁面' : '主導覽'}>
      {pages.filter((page) => page.scope === scope).map((page) => (
        <NavLink key={page.id} to={pageHref(page, tripSlug)} end>
          {page.title}
        </NavLink>
      ))}
    </nav>
  )
}
