import { HashRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from './AppShell'
import { Home } from '../views/Home'
import { Settings } from '../views/Settings'
import { TripLayout } from '../views/TripLayout'
import { TripView } from '../views/TripView'
import { tripViews } from '../views/tripViews'
import { NotFound } from '../views/NotFound'

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Home />} />
          <Route path="settings" element={<Settings />} />
          <Route path="trip/:tripSlug" element={<TripLayout />}>
            {tripViews.map((view) => (
              <Route key={view.path} path={view.path} element={<TripView title={view.title} />} />
            ))}
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
