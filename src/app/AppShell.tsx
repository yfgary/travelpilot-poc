import { NavLink, Outlet } from 'react-router-dom'
import { AppStatus } from '../components/AppStatus'
import { branding } from './metadata'

export function AppShell() {
  return (
    <div className="app-shell">
      <button className="skip-link" onClick={() => document.getElementById('main-content')?.focus()}>跳至內容</button>
      <header className="app-header">
        <NavLink to="/" className="brand" aria-label="TravelPilot｜旅程管家 首頁">
          <img src={branding.icon} alt="" width="44" height="44" />
          <span>TravelPilot｜旅程管家</span>
        </NavLink>
        <nav aria-label="主導覽">
          <NavLink to="/" end>首頁</NavLink>
          <NavLink to="/settings">設定</NavLink>
        </nav>
      </header>
      <main id="main-content" tabIndex={-1}><Outlet /></main>
      <AppStatus />
    </div>
  )
}
