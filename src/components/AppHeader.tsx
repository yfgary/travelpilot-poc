import { NavLink, useLocation } from 'react-router-dom'
import { useAppBack } from '../app/NavigationHistory'
import { branding } from '../app/metadata'
import { PageNavigation } from './PageNavigation'

export function AppHeader() {
  const back = useAppBack()
  const location = useLocation()
  return (
    <header className="app-header">
      <div className="header-inner">
        {location.pathname !== '/' && <button className="back-button" type="button" aria-label="返回上一頁" onClick={back}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m14 5-7 7 7 7M7 12h14" /></svg>
        </button>}
        <NavLink to="/" className="brand" aria-label="TravelPilot｜旅程管家 首頁">
          <img src={branding.icon} alt="" width="44" height="44" />
          <span>TravelPilot<span className="brand-subtitle">｜旅程管家</span></span>
        </NavLink>
        <PageNavigation />
      </div>
    </header>
  )
}
