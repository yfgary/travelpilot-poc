import { createContext, useContext, useEffect, useLayoutEffect, useState, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { ChecklistSyncManager, registerLocalDefinitions } from '../services/checklistSync'

const ChecklistContext = createContext<ChecklistSyncManager | null>(null)
export function ChecklistSyncProvider({ children }: { children: ReactNode }) {
  const [manager] = useState(() => new ChecklistSyncManager())
  const { session } = useAuth()
  const userId = session?.user.id ?? null
  useLayoutEffect(() => { manager.setUser(userId) }, [manager, userId])
  useEffect(() => {
    manager.start(); registerLocalDefinitions(manager); void manager.initialize()
    const online = () => manager.setOnline(navigator.onLine)
    const focus = () => { void manager.refresh().then(() => manager.requestSync()) }
    const visible = () => { if (document.visibilityState === 'visible') focus() }
    const timer = setInterval(() => manager.requestSync(), 30000)
    window.addEventListener('online', online); window.addEventListener('offline', online)
    window.addEventListener('focus', focus); document.addEventListener('visibilitychange', visible)
    return () => {
      clearInterval(timer); manager.stop()
      window.removeEventListener('online', online); window.removeEventListener('offline', online)
      window.removeEventListener('focus', focus); document.removeEventListener('visibilitychange', visible)
    }
  }, [manager])
  return <ChecklistContext.Provider value={manager}>{children}</ChecklistContext.Provider>
}
export function useChecklistSync() {
  const manager = useContext(ChecklistContext)
  if (!manager) throw new Error('ChecklistSyncProvider is required')
  const state = useSyncExternalStore(manager.subscribe, manager.snapshot)
  return { manager, ...state }
}
