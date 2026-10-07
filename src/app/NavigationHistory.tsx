import { createContext, useContext, useLayoutEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { useLocation, useNavigate, useNavigationType } from 'react-router-dom'

type Entry = { key: string; path: string }
type History = { entries: Entry[]; index: number }
const storageKey = 'travelpilot.navigation-history'
const BackContext = createContext<() => void>(() => {})
const safePath = (path: unknown): path is string => typeof path === 'string' && path.startsWith('/') && !/^\/\/|[\\\u0000-\u001f]/.test(path)

export function NavigationHistory({ children }: { children: ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const action = useNavigationType()
  const path = location.pathname + location.search + location.hash
  const history = useRef<History | null>(null)
  if (!history.current) {
    let restored: History | null = null
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey) ?? 'null') as History | null
      if (saved && Array.isArray(saved.entries) && Number.isInteger(saved.index) && saved.index >= 0 &&
        saved.entries.length <= 50 && saved.entries.every((entry) => typeof entry.key === 'string' && safePath(entry.path)) &&
        saved.entries[saved.index]?.key === location.key && saved.entries[saved.index]?.path === path) restored = saved
    } catch { /* Storage is optional; in-memory navigation still works. */ }
    history.current = restored ?? { entries: [{ key: location.key, path }], index: 0 }
  }

  useLayoutEffect(() => {
    const current = history.current!
    const existing = current.entries.findIndex((entry) => entry.key === location.key)
    if (existing >= 0) current.index = existing
    else if (action === 'REPLACE') current.entries[current.index] = { key: location.key, path }
    else {
      current.entries = [...current.entries.slice(0, current.index + 1), { key: location.key, path }].slice(-50)
      current.index = current.entries.length - 1
    }
    try { sessionStorage.setItem(storageKey, JSON.stringify(current)) } catch { /* Optional persistence. */ }
  }, [location.key, path, action])

  useLayoutEffect(() => {
    // Router updates the URL before React commits its transition. An immediate
    // reload must persist that pending entry too, using only safe hash routes.
    function persistBeforeUnload() {
      const current = history.current!
      const pendingPath = window.location.hash.slice(1) || '/'
      const pendingKey: unknown = window.history.state?.key ?? 'default'
      if (!safePath(pendingPath) || typeof pendingKey !== 'string') return
      const existing = current.entries.findIndex((entry) => entry.key === pendingKey)
      if (existing >= 0) current.index = existing
      else if (current.entries[current.index].path === pendingPath) {
        current.entries[current.index] = { key: pendingKey, path: pendingPath }
      } else {
        current.entries = [...current.entries.slice(0, current.index + 1), { key: pendingKey, path: pendingPath }].slice(-50)
        current.index = current.entries.length - 1
      }
      try { sessionStorage.setItem(storageKey, JSON.stringify(current)) } catch { /* Safe Home fallback on reload. */ }
    }
    window.addEventListener('pagehide', persistBeforeUnload)
    window.addEventListener('beforeunload', persistBeforeUnload)
    return () => {
      window.removeEventListener('pagehide', persistBeforeUnload)
      window.removeEventListener('beforeunload', persistBeforeUnload)
    }
  }, [])

  function back() {
    const current = history.current!
    const previous = current.entries[current.index - 1]
    if (previous && safePath(previous.path)) {
      current.entries = current.entries.slice(0, current.index)
      current.index--
      navigate(previous.path, { replace: true })
    } else navigate('/', { replace: true })
  }
  // Navigate to recorded app routes, never to an unverified browser history entry.
  return <BackContext.Provider value={back}>{children}</BackContext.Provider>
}

export const useAppBack = () => useContext(BackContext)
