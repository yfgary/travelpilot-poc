import { openDB } from 'idb'
import { compareChanges } from '../src/data/checklistState.ts'
import type { ChecklistState } from '../src/data/checklistState.ts'

// Existing Preview IDB format stays readable. No normal database is opened.
export const PREVIEW_CHECKLIST_DATABASE = 'travelpilot-preview-v2-user-state'
const database = () => openDB(PREVIEW_CHECKLIST_DATABASE, 1, {
  upgrade(db) {
    db.createObjectStore('checklistState', { keyPath: ['scope', 'tripId', 'checklistItemId'] })
    db.createObjectStore('syncMeta', { keyPath: ['ownerId', 'tripId'] })
    db.createObjectStore('meta')
  },
  blocking(_current, _blocked, event) { (event.target as IDBDatabase).close() },
})
export interface PreviewChecklistStore {
  read(): Promise<ChecklistState[]>
  commit(row: ChecklistState): Promise<ChecklistState>
}
export const previewChecklistStore: PreviewChecklistStore = {
  async read() {
    const db = await database()
    try { return await db.getAll('checklistState') } finally { db.close() }
  },
  async commit(row) {
    const db = await database()
    try {
      const tx = db.transaction('checklistState', 'readwrite')
      try {
        const old = await tx.store.get([row.scope, row.tripId, row.checklistItemId]) as ChecklistState | undefined
        const winner = old && compareChanges(old, row) > 0 ? old : row
        if (winner === row) await tx.store.put(row)
        await tx.done // put success is NOT the durability acknowledgement.
        return winner
      } catch (error) { await tx.done.catch(() => {}); throw error }
    } finally { db.close() }
  },
}
