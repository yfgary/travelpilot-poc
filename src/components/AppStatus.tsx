import { useEffect, useState } from 'react'
import { APP_VERSION } from '../app/metadata'

export function AppStatus() {
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    update()
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])

  return (
    <aside className="app-status" aria-label="連線狀態與應用程式版本" role="status">
      <span className="connection-indicator"><span className={online ? 'connection-dot online' : 'connection-dot offline'} aria-hidden="true" /><span>{online ? 'ONLINE' : 'OFFLINE'}</span></span>
      <span>App Version {APP_VERSION}</span>
    </aside>
  )
}
