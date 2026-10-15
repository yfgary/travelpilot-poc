import { Outlet } from 'react-router-dom'
import { AppStatus } from '../src/components/AppStatus'
import { AppHeader } from '../src/components/AppHeader'
import { BackToTop } from '../src/components/BackToTop'
import { PreviewNotice } from './Notice'
export function AppShell() {
  return <div className="app-shell">
    <button className="skip-link" onClick={() => document.getElementById('main-content')?.focus()}>跳至內容</button>
    <PreviewNotice /><AppHeader />
    <main id="main-content" className="content-shell" tabIndex={-1}><Outlet /></main>
    <BackToTop /><div className="status-dock"><AppStatus /></div>
  </div>
}
