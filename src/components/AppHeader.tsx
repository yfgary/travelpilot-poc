import { NavLink } from 'react-router-dom'
import { branding } from '../app/metadata'
import { PageNavigation } from './PageNavigation'

export function AppHeader() {
  return (
    <header className="app-header">
      <div className="header-inner">
        <NavLink to="/" className="brand" aria-label="TravelPilot｜旅程管家 首頁">
          <img src={branding.icon} alt="" width="44" height="44" />
          <span>TravelPilot<span className="brand-subtitle">｜旅程管家</span></span>
        </NavLink>
        <PageNavigation />
      </div>
    </header>
  )
}
