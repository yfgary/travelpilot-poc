import { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import { PreviewChecklistManager } from './checklistIntents'
import { listTrips } from './trips'
const ChecklistContext = createContext<PreviewChecklistManager | null>(null)
export function ChecklistSyncProvider({ children }: { children: ReactNode }) {
  const [manager] = useState(() => new PreviewChecklistManager())
  useEffect(() => {
    manager.start()
    void listTrips().then(({ trips }) => { for (const trip of trips) manager.register(trip.snapshot, null); return manager.initialize() })
    return () => manager.stop()
  }, [manager])
  return <ChecklistContext.Provider value={manager}>{children}</ChecklistContext.Provider>
}
export function useChecklistSync() {
  const manager = useContext(ChecklistContext)
  if (!manager) throw new Error('Preview ChecklistSyncProvider is required')
  return { manager, ...useSyncExternalStore(manager.subscribe, manager.snapshot) }
}
export function PreviewChecklistStatus() {
  const { ready, saving, saved, error } = useChecklistSync()
  if (error) return <p role="alert" data-testid="preview-checklist-durability">儲存失敗：未能確認本機清單已儲存；待處理操作會在儲存恢復後重新讀取。請勿清除網站資料。</p>
  if (!ready) return <p role="status" data-testid="preview-checklist-durability">正在恢復本機清單…</p>
  if (!saving && !saved) return null
  return <p role="status" data-testid="preview-checklist-durability">{saving ? '正在儲存清單…' : '已儲存此裝置'}</p>
}
