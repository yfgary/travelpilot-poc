import { HashRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from './AppShell'
import { Home } from '../views/Home'
import { Settings } from '../views/Settings'
import { TripLayout } from '../views/TripLayout'
import { TripView } from '../views/TripView'
import { DetailedItinerary } from '../views/DetailedItinerary'
import { TripInformation } from '../views/TripInformation'
import { pages, tripPages } from './pages'
import { PreferencesProvider } from './Preferences'
import { AuthProvider } from '../auth/AuthProvider'
import { NotFound } from '../views/NotFound'
import { NavigationHistory } from './NavigationHistory'
import { ChecklistSyncProvider } from './ChecklistSync'

export function App() {
  return (
    <AuthProvider>
      <ChecklistSyncProvider>
      <PreferencesProvider>
        <HashRouter>
          <NavigationHistory>
            <Routes>
              <Route element={<AppShell />}>
                <Route path={pages.find((page) => page.id === 'home')!.path} element={<Home />} />
                <Route path={pages.find((page) => page.id === 'settings')!.path} element={<Settings />} />
                <Route path="trip/:tripSlug" element={<TripLayout />}>
                  {tripPages.map((view) => (
                    <Route key={view.path} path={view.path} element={view.id === 'itinerary' ? <DetailedItinerary /> : view.id === 'info' ? <TripInformation /> : <TripView title={view.title} showWeather={view.id === 'live'} />} />
                  ))}
                </Route>
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </NavigationHistory>
        </HashRouter>
      </PreferencesProvider>
      </ChecklistSyncProvider>
    </AuthProvider>
  )
}
