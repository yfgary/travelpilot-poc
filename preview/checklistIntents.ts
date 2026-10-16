import { compareChanges, stateKey } from '../src/data/checklistState.ts'
import type { ChecklistState } from '../src/data/checklistState.ts'
import type { TripSnapshot } from '../src/data/schema/trip.ts'
import { previewChecklistStore } from './checklistStore.ts'
import type { PreviewChecklistStore } from './checklistStore.ts'

export const INTENT_PREFIX = 'travelpilot-preview.checklist-intent.'
export const HEAD_PREFIX = 'travelpilot-preview.checklist-head.'
export const CHECKLIST_LOCK = 'travelpilot-preview.checklist-durability.v1'
const CHANNEL = 'travelpilot-preview.checklist-state'
type Head = { format: 1; tripId: string; itemId: string; revision: number; operationId: string }
type Intent = Head & { checked: boolean }
type View = { revision: number; ready: boolean; online: boolean; syncing: boolean; error: boolean; persistenceUnavailable: boolean; saving: boolean; saved: boolean }
type Dependencies = { storage: Storage; store: PreviewChecklistStore; exclusive: (task: () => Promise<void>) => Promise<void>; now: () => number; id: () => string }
const itemKey = (tripId: string, itemId: string) => encodeURIComponent(JSON.stringify([tripId, itemId]))
const headKey = (record: Head) => `${HEAD_PREFIX}v1.${itemKey(record.tripId, record.itemId)}`
const intentKey = (record: Intent) => `${INTENT_PREFIX}v1.${itemKey(record.tripId, record.itemId)}.${record.operationId}`
const tuple = (record: Head) => ({ clientUpdatedAt: new Date(record.revision).toISOString(), deviceId: record.operationId })
const rowFor = (record: Intent): ChecklistState => ({ ...tuple(record), scope: 'local-demo', ownerId: null, tripId: record.tripId, checklistItemId: record.itemId, checked: record.checked, dirty: false })

// Preview-only local contract: no copy of the shared cloud-sync engine.
// Append-only operation keys prevent one tab deleting another tab's newer intent.
export class PreviewChecklistManager {
  private dependencies: Dependencies
  private definitions = new Map<string, Set<string>>()
  private rows = new Map<string, ChecklistState>()
  private listeners = new Set<() => void>()
  private clock = 0
  private work: Promise<void> | null = null
  private again = false
  private channel: BroadcastChannel | null = null
  private view: View = { revision: 0, ready: false, online: true, syncing: false, error: false, persistenceUnavailable: false, saving: false, saved: false }
  constructor(dependencies?: Dependencies) {
    this.dependencies = dependencies ?? {
      // Lazy storage access so SecurityError is caught and shown, not render-crashed.
      storage: {
        get length() { return localStorage.length }, key: index => localStorage.key(index),
        getItem: key => localStorage.getItem(key), setItem: (key, value) => localStorage.setItem(key, value),
        removeItem: key => localStorage.removeItem(key), clear: () => { throw new Error('Origin-wide clear forbidden') },
      },
      store: previewChecklistStore,
      exclusive: async task => {
        if (!navigator.locks) throw new Error('Local coordination unavailable')
        await navigator.locks.request(CHECKLIST_LOCK, task)
      },
      now: () => Date.now(), id: () => crypto.randomUUID(),
    }
  }
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener) } }
  snapshot = () => this.view
  private publish(patch: Partial<View> = {}) { this.view = { ...this.view, ...patch, revision: this.view.revision + 1 }; this.listeners.forEach(listener => listener()) }
  private failure() { this.publish({ error: true, persistenceUnavailable: true, saving: false, saved: false }) }
  register(snapshot: TripSnapshot, ownerId: string | null) {
    if (ownerId !== null) return
    this.definitions.set(snapshot.trip.id, new Set(snapshot.checklists.flatMap(list => list.groups.flatMap(group => group.items.map(item => item.id)))))
  }
  private validItem(tripId: string, itemId: string) { return this.definitions.get(tripId)?.has(itemId) === true }
  private parse(raw: string | null, intent: boolean): Head | Intent {
    if (raw === null || raw.length > 1024) throw new Error('Invalid Preview operation')
    const record = JSON.parse(raw) as Intent
    const keys = ['format', 'tripId', 'itemId', 'revision', 'operationId', ...(intent ? ['checked'] : [])].sort()
    if (!record || JSON.stringify(Object.keys(record).sort()) !== JSON.stringify(keys) || record.format !== 1 ||
      typeof record.tripId !== 'string' || record.tripId.length > 256 || typeof record.itemId !== 'string' || record.itemId.length > 256 ||
      !this.validItem(record.tripId, record.itemId) || !Number.isSafeInteger(record.revision) || record.revision < 0 || record.revision > 8640000000000000 ||
      typeof record.operationId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(record.operationId) ||
      intent && typeof record.checked !== 'boolean') throw new Error('Invalid Preview operation')
    return record
  }
  private journal() {
    const { storage } = this.dependencies, intents: Intent[] = [], heads: Head[] = []
    for (let index = 0; index < storage.length; index++) {
      const key = storage.key(index)
      if (!key || !key.startsWith(INTENT_PREFIX) && !key.startsWith(HEAD_PREFIX)) continue
      const isIntent = key.startsWith(INTENT_PREFIX), record = this.parse(storage.getItem(key), isIntent)
      if (key !== (isIntent ? intentKey(record as Intent) : headKey(record))) throw new Error('Invalid Preview operation key')
      if (isIntent) intents.push(record as Intent); else heads.push(record)
      if (intents.length > 2000 || heads.length > 10000) throw new Error('Preview operation limit exceeded')
    }
    return { intents, heads }
  }
  row(ownerId: string | null, tripId: string, itemId: string) { return ownerId === null ? this.rows.get(stateKey(null, tripId, itemId)) : undefined }
  status() { return '只儲存在此裝置' } // Scope label, separate from truthful commit status.
  mutate(ownerId: string | null, tripId: string, itemId: string, checked: boolean) {
    if (!this.view.ready || ownerId !== null || !this.validItem(tripId, itemId)) return
    try {
      const { intents, heads } = this.journal()
      if (intents.length >= 2000) throw new Error('Preview operation limit exceeded')
      const revision = Math.max(this.dependencies.now(), this.clock + 1, ...intents.map(row => row.revision + 1), ...heads.map(row => row.revision + 1))
      const intent: Intent = { format: 1, tripId, itemId, revision, operationId: this.dependencies.id(), checked }
      const raw = JSON.stringify(intent)
      this.parse(raw, true)
      this.dependencies.storage.setItem(intentKey(intent), raw) // BEFORE optimistic UI acknowledgement.
      this.clock = revision; this.rows.set(stateKey(null, tripId, itemId), rowFor(intent))
      this.publish({ saving: true, saved: false, error: false, persistenceUnavailable: false })
      void this.refresh()
    } catch { this.failure() } // Re-render unchanged controlled input; no false saved claim.
  }
  initialize() { return this.refresh() }
  refresh(): Promise<void> {
    this.again = true
    if (this.work) return this.work
    this.work = (async () => {
      do {
        this.again = false
        try {
          await this.dependencies.exclusive(async () => {
            const { intents } = this.journal()
            let changed = false
            for (const intent of intents.sort((a, b) => compareChanges(tuple(a), tuple(b)))) {
              const winner = await this.dependencies.store.commit(rowFor(intent))
              // Atomic IDB compare protects against a newer committed tab's row.
              const head: Head = { format: 1, tripId: intent.tripId, itemId: intent.itemId, revision: Date.parse(winner.clientUpdatedAt), operationId: winner.deviceId }
              // Legacy IDB device IDs are UUIDs too. A winner's exact revision is
              // retained after intent removal, so future tab revisions advance.
              this.parse(JSON.stringify(head), false)
              this.dependencies.storage.setItem(headKey(head), JSON.stringify(head))
              const key = intentKey(intent)
              if (this.dependencies.storage.getItem(key) === JSON.stringify(intent)) this.dependencies.storage.removeItem(key)
              changed = true
            }
            const rows = await this.dependencies.store.read()
            const next = new Map<string, ChecklistState>()
            for (const row of rows) if (row.scope === 'local-demo' && row.ownerId === null && this.validItem(row.tripId, row.checklistItemId)) {
              next.set(stateKey(null, row.tripId, row.checklistItemId), row)
              this.clock = Math.max(this.clock, Date.parse(row.clientUpdatedAt))
            }
            // A click/new tab can append while the IDB transaction is pending.
            const pending = this.journal().intents
            for (const intent of pending) {
              const key = stateKey(null, intent.tripId, intent.itemId), old = next.get(key), row = rowFor(intent)
              if (!old || compareChanges(row, old) > 0) next.set(key, row)
            }
            this.rows = next
            if (pending.length) this.again = true
            // Initial ready is withheld until every accepted intent is replayed.
            this.publish({ ready: this.view.ready || !pending.length, saving: pending.length > 0, saved: !pending.length && next.size > 0, error: false, persistenceUnavailable: false })
            if (changed) this.channel?.postMessage('changed')
          })
        } catch { this.again = false; this.failure() }
      } while (this.again)
    })().finally(() => { this.work = null; if (this.again) void this.refresh() })
    return this.work
  }
  start() {
    try {
      this.channel = new BroadcastChannel(CHANNEL)
      this.channel.onmessage = event => { if (event.data === 'changed') void this.refresh() }
    } catch { /* Namespaced storage events/focus reconciliation remain available. */ }
    window.addEventListener('storage', this.storageChanged)
    window.addEventListener('focus', this.focused)
  }
  stop() { this.channel?.close(); this.channel = null; window.removeEventListener('storage', this.storageChanged); window.removeEventListener('focus', this.focused) }
  private storageChanged = (event: StorageEvent) => {
    if (!event.key?.startsWith(INTENT_PREFIX) && !event.key?.startsWith(HEAD_PREFIX)) return
    try {
      // A different tab's accepted intent is visible even while the IDB lock is
      // held. Never enable initial controls before actual startup replay.
      const { intents } = this.journal()
      for (const intent of intents) {
        const key = stateKey(null, intent.tripId, intent.itemId), row = rowFor(intent), old = this.rows.get(key)
        if (!old || compareChanges(row, old) > 0) this.rows.set(key, row)
        this.clock = Math.max(this.clock, intent.revision)
      }
      if (intents.length) this.publish({ saving: true, saved: false })
      void this.refresh()
    } catch { this.failure() }
  }
  private focused = () => { void this.refresh() }
}
