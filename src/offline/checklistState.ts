import { openDB } from 'idb'
import type { DBSchema } from 'idb'
import { compareChanges, nextMutationTime, ownerScope } from '../data/checklistState'
import type { ChecklistState } from '../data/checklistState'

export const USER_STATE_DATABASE = 'travelpilot-v2-user-state'
export type SyncMeta = { ownerId: string; tripId: string; lastSuccessfulAt: string }
interface UserDB extends DBSchema {
  checklistState: { key: [string, string, string]; value: ChecklistState }
  syncMeta: { key: [string, string]; value: SyncMeta }
  meta: { key: string; value: string | number }
}
const database = () => openDB<UserDB>(USER_STATE_DATABASE, 1, {
  upgrade(db) {
    db.createObjectStore('checklistState', { keyPath: ['scope', 'tripId', 'checklistItemId'] })
    db.createObjectStore('syncMeta', { keyPath: ['ownerId', 'tripId'] })
    db.createObjectStore('meta')
  },
  blocking(_current, _blocked, event) { (event.target as IDBDatabase).close() },
})
export async function readUserState(ownerId: string | null) {
  const db = await database()
  try {
    const tx = db.transaction(['checklistState', 'syncMeta', 'meta'], 'readwrite')
    let deviceId = await tx.objectStore('meta').get('deviceId')
    if (typeof deviceId !== 'string') { deviceId = crypto.randomUUID(); await tx.objectStore('meta').put(deviceId, 'deviceId') }
    const clock = await tx.objectStore('meta').get('lastMutationTime')
    const state = tx.objectStore('checklistState'), syncStore = tx.objectStore('syncMeta')
    const range = (scope: string) => IDBKeyRange.bound([scope, '', ''], [scope, '\uffff', '\uffff'])
    // Signed-out device access is intentional. Signed-in reads fetch only this
    // account's rows plus the shared null-owner local demo scope.
    const rows = ownerId
      ? [...await state.getAll(range(ownerId)), ...await state.getAll(range(ownerScope(null)))]
      : await state.getAll()
    const sync = ownerId ? await syncStore.getAll(IDBKeyRange.bound([ownerId, ''], [ownerId, '\uffff'])) : await syncStore.getAll()
    await tx.done
    return { deviceId, clock: typeof clock === 'number' ? clock : 0, rows, sync }
  } finally { db.close() }
}
export async function persistMutation(record: ChecklistState): Promise<ChecklistState> {
  const db = await database()
  try {
    const tx = db.transaction(['checklistState', 'meta'], 'readwrite')
    const clock = await tx.objectStore('meta').get('lastMutationTime')
    const old = await tx.objectStore('checklistState').get([record.scope, record.tripId, record.checklistItemId])
    const time = nextMutationTime(Date.parse(record.clientUpdatedAt), Math.max(typeof clock === 'number' ? clock : 0, old ? Date.parse(old.clientUpdatedAt) : 0))
    const saved = { ...record, clientUpdatedAt: new Date(time).toISOString() }
    await tx.objectStore('checklistState').put(saved)
    await tx.objectStore('meta').put(time, 'lastMutationTime')
    await tx.done
    return saved
  } finally { db.close() }
}
export async function mergeRemoteStates(records: ChecklistState[]): Promise<void> {
  const db = await database()
  try {
    const tx = db.transaction('checklistState', 'readwrite')
    for (const record of records) {
      const old = await tx.store.get([record.scope, record.tripId, record.checklistItemId])
      if (!old || compareChanges(record, old) >= 0) await tx.store.put(record)
    }
    await tx.done
  } finally { db.close() }
}
export async function saveSyncMeta(meta: SyncMeta) {
  const db = await database()
  try { await db.put('syncMeta', meta) } finally { db.close() }
}
export async function clearChecklistData() {
  const db = await database()
  try {
    const tx = db.transaction(['checklistState', 'syncMeta'], 'readwrite')
    await Promise.all([tx.objectStore('checklistState').clear(), tx.objectStore('syncMeta').clear(), tx.done])
    // Keep the non-secret device ID/clock; this avoids timestamp reuse on reset.
  } finally { db.close() }
}


// Aggregate only, for explicitly requested all-device clearing warnings.
export async function countPendingForClear(): Promise<number> {
  const db = await database()
  try { return (await db.getAll('checklistState')).filter((row) => row.ownerId && row.dirty).length }
  finally { db.close() }
}
