import { compareChanges, nextMutationTime, ownerScope, stateKey } from '../data/checklistState'
import type { ChecklistState } from '../data/checklistState'
import type { TripSnapshot } from '../data/schema/trip'
import { localTrips } from '../data/trips'
import { readUserState, persistMutation, mergeRemoteStates, saveSyncMeta, clearChecklistData, countPendingForClear } from '../offline/checklistState'
import type { SyncMeta } from '../offline/checklistState'
import { listCachedTrips, clearTripCache } from '../offline/tripCache'
import { pullChecklist, pushChecklist } from './checklists'

type TripScope = { ownerId: string | null; tripId: string; ids: Set<string> }
export type ChecklistSyncView = { revision: number; ready: boolean; online: boolean; syncing: boolean; error: boolean; persistenceUnavailable: boolean }
export class ChecklistSyncManager {
  private listeners = new Set<() => void>()
  private rows = new Map<string, ChecklistState>()
  private contexts = new Map<string, TripScope>()
  private syncMeta: SyncMeta[] = []
  private deviceId: string = crypto.randomUUID()
  private clock = 0
  private userId: string | null = null
  private generation = 0
  private controller: AbortController | null = null
  private active: Promise<void> | null = null
  private timer: ReturnType<typeof setTimeout> | undefined
  private serial: Promise<void> = Promise.resolve()
  private initializePromise: Promise<void> | null = null
  private channel: BroadcastChannel | null = null
  private clearing = false
  private again = false
  private view: ChecklistSyncView = { revision: 0, ready: false, online: navigator.onLine, syncing: false, error: false, persistenceUnavailable: false }
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener) } }
  snapshot = () => this.view
  private publish(patch: Partial<ChecklistSyncView> = {}) {
    this.view = { ...this.view, ...patch, revision: this.view.revision + 1 }
    this.listeners.forEach((listener) => listener())
  }
  private enqueue(operation: () => Promise<void>) {
    this.serial = this.serial.then(operation).catch(() => this.publish({ persistenceUnavailable: true }))
    return this.serial
  }
  initialize() {
    return this.initializePromise ??= (async () => {
      try {
        const data = await readUserState(this.userId)
        this.deviceId = data.deviceId; this.clock = data.clock
        this.rows = new Map(data.rows.filter((row) => !this.userId || row.ownerId === null || row.ownerId === this.userId).map((row) => [stateKey(row.ownerId, row.tripId, row.checklistItemId), row]))
        this.syncMeta = data.sync.filter((meta) => !this.userId || meta.ownerId === this.userId)
      } catch { this.publish({ persistenceUnavailable: true }) }
      this.publish({ ready: true })
    })()
  }
  start() {
    try {
      this.channel = new BroadcastChannel('travelpilot.checklist-state')
      this.channel.onmessage = (event: MessageEvent<unknown>) => {
        if (event.data === 'cleared') {
          this.cancel(); this.rows.clear(); this.syncMeta = []; this.contexts.clear(); this.publish({ error: false, syncing: false })
        } else if (event.data === 'changed') void this.refresh()
      }
    } catch { /* Focus reconciliation still works without cross-tab messaging. */ }
  }
  stop() { this.cancel(); this.channel?.close(); this.channel = null }
  private cancel() { this.generation++; this.controller?.abort(); clearTimeout(this.timer); this.again = false }
  setUser(userId: string | null) {
    if (this.userId === userId) return
    this.cancel(); this.userId = userId
    if (userId) {
      this.rows = new Map([...this.rows].filter(([, row]) => row.ownerId === null || row.ownerId === userId))
      this.syncMeta = this.syncMeta.filter((meta) => meta.ownerId === userId)
    }
    this.publish({ error: false })
    void this.refresh().then(() => this.requestSync())
  }
  setOnline(online: boolean) { this.publish({ online }); if (online) this.requestSync(); else this.cancel() }
  register(snapshot: TripSnapshot, ownerId: string | null) {
    const ids = new Set(snapshot.checklists.flatMap((list) => list.groups.flatMap((group) => group.items.map((item) => item.id))))
    this.contexts.set(JSON.stringify([ownerId, snapshot.trip.id]), { ownerId, tripId: snapshot.trip.id, ids })
    this.requestSync()
  }
  row(ownerId: string | null, tripId: string, itemId: string) { return this.rows.get(stateKey(ownerId, tripId, itemId)) }
  pendingCount(allDevice = false) {
    return [...this.rows.values()].filter((row) => {
      const definition = this.contexts.get(JSON.stringify([row.ownerId, row.tripId]))
      return row.dirty && row.ownerId && (allDevice || ((!this.userId || row.ownerId === this.userId) && (!definition || definition.ids.has(row.checklistItemId))))
    }).length
  }
  async pendingForClear() { await this.serial; try { return await countPendingForClear() } catch { return this.pendingCount(true) } }
  lastSuccessful() { return this.syncMeta.filter((meta) => !this.userId || meta.ownerId === this.userId).map((meta) => meta.lastSuccessfulAt).sort().at(-1) }
  status(ownerId: string | null, tripId: string, ids: string[]) {
    if (!ownerId) return '只儲存在此裝置'
    if (!this.view.online) return '離線'
    if (this.view.error) return '同步稍後重試'
    if (ids.some((id) => this.row(ownerId, tripId, id)?.dirty)) return '待同步'
    return this.syncMeta.some((meta) => meta.ownerId === ownerId && meta.tripId === tripId) ? '已同步' : '尚未同步'
  }
  mutate(ownerId: string | null, tripId: string, itemId: string, checked: boolean) {
    if (!this.view.ready || this.clearing) return
    const context = this.contexts.get(JSON.stringify([ownerId, tripId]))
    if (!context?.ids.has(itemId)) return
    // A signed-out cached owner can edit locally; a different account cannot.
    if (ownerId && this.userId && ownerId !== this.userId) return
    const key = stateKey(ownerId, tripId, itemId), old = this.rows.get(key)
    this.clock = nextMutationTime(Date.now(), Math.max(this.clock, old ? Date.parse(old.clientUpdatedAt) : 0))
    const optimistic: ChecklistState = { scope: ownerScope(ownerId), ownerId, tripId, checklistItemId: itemId,
      checked, clientUpdatedAt: new Date(this.clock).toISOString(), deviceId: this.deviceId, dirty: ownerId !== null }
    this.rows.set(key, optimistic); this.publish()
    void this.enqueue(async () => {
      const saved = await persistMutation(optimistic)
      this.clock = Math.max(this.clock, Date.parse(saved.clientUpdatedAt))
      if (this.rows.get(key) === optimistic) { this.rows.set(key, saved); this.publish() }
      this.channel?.postMessage('changed')
    })
    this.requestSync()
  }
  async refresh() {
    await this.initialize(); await this.serial
    if (this.clearing) return
    const generation = this.generation
    try {
      const data = await readUserState(this.userId)
      if (this.clearing || generation !== this.generation) return
      for (const row of data.rows) {
        const key = stateKey(row.ownerId, row.tripId, row.checklistItemId), old = this.rows.get(key)
        if (!old || compareChanges(row, old) >= 0) this.rows.set(key, row)
      }
      this.clock = Math.max(this.clock, data.clock); this.syncMeta = data.sync; this.publish()
    } catch { this.publish({ persistenceUnavailable: true }) }
  }
  requestSync() {
    if (this.clearing || !this.userId || !this.view.online || document.visibilityState === 'hidden') return
    if (this.active) { this.again = true; return }
    clearTimeout(this.timer)
    this.timer = setTimeout(() => { void this.syncNow() }, 500)
  }
  async syncNow() {
    if (this.active) { this.again = true; return this.active }
    if (this.clearing || !this.userId || !this.view.online || document.visibilityState === 'hidden') return
    clearTimeout(this.timer)
    const ownerId = this.userId, generation = this.generation, controller = new AbortController()
    this.controller = controller
    const valid = () => generation === this.generation && ownerId === this.userId && !controller.signal.aborted && !this.clearing
    const deadline = setTimeout(() => controller.abort(), 15000)
    this.active = (async () => {
      await this.initialize(); await this.refresh()
      try {
        for (const record of await listCachedTrips(ownerId)) {
          const ids = new Set(record.payload.checklists.flatMap((list) => list.groups.flatMap((group) => group.items.map((item) => item.id))))
          const key = JSON.stringify([ownerId, record.tripId])
          if (!this.contexts.has(key)) this.contexts.set(key, { ownerId, tripId: record.tripId, ids })
        }
      } catch { /* An in-memory validated remote trip can still synchronize. */ }
      if (!valid()) return
      const contexts = [...this.contexts.values()].filter((trip) => trip.ownerId === ownerId && trip.ids.size)
      if (!contexts.length) return
      this.publish({ syncing: true, error: false })
      try {
        for (const context of contexts) {
          if (!valid()) return
          const { tripId, ids } = context
          let remoteById = new Map<string, ChecklistState>()
          const reconcile = async () => {
            const remote = await pullChecklist(ownerId, tripId, ids, controller.signal)
            remoteById = new Map(remote.map((record) => [record.checklistItemId, record]))
            if (!valid()) return
            await this.enqueue(async () => {
              if (!valid()) return
              const winners = remote.filter((record) => {
                const local = this.row(ownerId, tripId, record.checklistItemId)
                return !local || compareChanges(record, local) >= 0
              })
              // Valid remote winners remain usable even if device storage is
              // blocked. Newer local edits are protected by the tuple comparison.
              try { await mergeRemoteStates(winners) } catch { this.publish({ persistenceUnavailable: true }) }
              if (!valid()) return
              for (const winner of winners) {
                const key = stateKey(ownerId, tripId, winner.checklistItemId), local = this.rows.get(key)
                if (!local || compareChanges(winner, local) >= 0) this.rows.set(key, winner)
              }
              this.publish()
            })
          }
          await reconcile(); await this.serial
          if (!valid()) return
          const pending = [...this.rows.values()].filter((row) => row.ownerId === ownerId && row.tripId === tripId && ids.has(row.checklistItemId) &&
            (!remoteById.has(row.checklistItemId) || compareChanges(row, remoteById.get(row.checklistItemId)!) > 0))
          if (pending.length) {
            for (const row of pending) { row.dirty = true }
            await this.enqueue(async () => { if (valid()) await mergeRemoteStates(pending) })
            this.publish()
            await pushChecklist(ownerId, tripId, pending, controller.signal)
            if (!valid()) return
            await reconcile()
          }
          if (!valid()) return
          const meta = { ownerId, tripId, lastSuccessfulAt: new Date().toISOString() }
          await this.enqueue(async () => { if (valid()) { try { await saveSyncMeta(meta) } catch { this.publish({ persistenceUnavailable: true }) }; if (!valid()) return; this.syncMeta = this.syncMeta.filter((old) => old.ownerId !== ownerId || old.tripId !== tripId).concat(meta); this.publish() } })
          this.channel?.postMessage('changed')
        }
      } catch { if (generation === this.generation && ownerId === this.userId && !this.clearing) this.publish({ error: true }) }
    })().finally(() => {
      clearTimeout(deadline); this.active = null
      this.publish({ syncing: false })
      if (this.again && !this.clearing && !this.view.error) { this.again = false; this.requestSync() }
    })
    return this.active
  }
  async clearLocalData() {
    this.clearing = true; this.cancel()
    try {
      await this.active; await this.serial
      await Promise.all([clearTripCache(), clearChecklistData()])
      this.rows.clear(); this.syncMeta = []; this.contexts.clear(); this.publish({ error: false })
      this.channel?.postMessage('cleared')
    } finally { this.clearing = false }
  }
}

export function registerLocalDefinitions(manager: ChecklistSyncManager) {
  for (const record of localTrips) manager.register(record.payload, null)
}
