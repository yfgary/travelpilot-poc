import type { Page, TestInfo } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

// Opt-in test observation only. No writes, awaited probes or durability barriers
// between checkbox change and the ORIGINAL immediate reload assertion.
export async function observePreviewChecklist(page: Page, info: TestInfo, target: { tripId: string; itemId: string }) {
  const started = Date.now(), events: unknown[] = []
  const prefix = '__TP_PREVIEW_DURABILITY__'
  const log = (data: object) => events.push({ receivedMs: Date.now() - started, ...data })
  const consoleEvent = (message: import('@playwright/test').ConsoleMessage) => {
    const text = message.text()
    if (text.startsWith(prefix)) {
      try { log(JSON.parse(text.slice(prefix.length))) } catch { /* Only our JSON marker is recorded. */ }
    }
  }
  page.on('console', consoleEvent)
  const originalReload = page.reload
  page.reload = function (...args) {
    log({ kind: 'test-reload-call' })
    return originalReload.apply(this, args).then(result => { log({ kind: 'test-reload-return' }); return result })
  }
  await page.addInitScript(({ prefix, started }) => {
    if (location.origin !== 'http://127.0.0.1:4174') return
    const hash = (value: unknown) => {
      let result = 2166136261
      for (const character of String(value)) result = Math.imul(result ^ character.charCodeAt(0), 16777619)
      return (result >>> 0).toString(16).padStart(8, '0')
    }
    const emit = (value: object) => console.debug(prefix + JSON.stringify({ browserMs: performance.timeOrigin + performance.now() - started, document: performance.timeOrigin - started, ...value }))
    const allowed = (name: string) => /^travelpilot-(?:preview-)?v2-user-state$/.test(name)
    const row = (value: any) => value && typeof value === 'object' ? {
      scope: value.scope === 'local-demo' ? 'local-demo' : 'redacted-owner', owner: value.ownerId === null ? 'null' : 'redacted',
      tripHash: hash(value.tripId), itemHash: hash(value.checklistItemId), checked: Boolean(value.checked),
    } : null
    const key = (value: unknown) => Array.isArray(value) ? { scope: value[0] === 'local-demo' ? 'local-demo' : 'redacted-owner', tripHash: hash(value[1]), itemHash: hash(value[2]) } : undefined
    let sequence = 0
    const transactions = new WeakMap<IDBTransaction, number>(), pending = new Set<number>()
    const open = IDBFactory.prototype.open
    IDBFactory.prototype.open = function (...args) {
      const request = open.apply(this, args)
      if (allowed(String(args[0]))) {
        emit({ kind: 'db-open', db: args[0] })
        for (const event of ['success', 'error', 'blocked']) request.addEventListener(event, () => emit({ kind: `db-${event}`, db: args[0], error: event === 'error' ? request.error?.name : undefined }))
      }
      return request
    }
    const transaction = IDBDatabase.prototype.transaction
    IDBDatabase.prototype.transaction = function (...args) {
      const tx = transaction.apply(this, args)
      if (allowed(this.name)) {
        const id = ++sequence
        transactions.set(tx, id); pending.add(id)
        const label = { db: this.name, tx: id, stores: [...tx.objectStoreNames], mode: tx.mode }
        emit({ kind: 'tx-start', ...label })
        for (const event of ['complete', 'abort', 'error']) tx.addEventListener(event, () => {
          emit({ kind: `tx-${event}`, ...label, error: tx.error?.name })
          if (event !== 'error') pending.delete(id)
        })
      }
      return tx
    }
    for (const operation of ['get', 'getAll', 'put', 'delete', 'clear'] as const) {
      const original = IDBObjectStore.prototype[operation]
      ;(IDBObjectStore.prototype[operation] as any) = function (this: IDBObjectStore, ...args: any[]) {
        const request = (original as Function).apply(this, args) as IDBRequest
        if (allowed(this.transaction.db.name)) {
          const label = { db: this.transaction.db.name, tx: transactions.get(this.transaction), store: this.name, operation }
          emit({ kind: 'request', ...label, key: this.name === 'checklistState' ? key(args[0]) : undefined, row: operation === 'put' && this.name === 'checklistState' ? row(args[0]) : undefined })
          request.addEventListener('success', () => emit({ kind: 'request-success', ...label,
            row: operation === 'get' && this.name === 'checklistState' ? row(request.result) : undefined,
            rows: operation === 'getAll' && this.name === 'checklistState' ? (request.result as unknown[]).map(row) : undefined,
          }))
          request.addEventListener('error', () => emit({ kind: 'request-error', ...label, error: request.error?.name }))
        }
        return request
      }
    }
    const state = () => {
      const input = document.querySelector<HTMLInputElement>('[data-checklist-item-id] input[type="checkbox"]')
      return input ? { itemHash: hash(input.closest<HTMLElement>('[data-checklist-item-id]')?.dataset.checklistItemId), checked: input.checked, disabled: input.disabled } : null
    }
    document.addEventListener('change', event => {
      const input = event.target
      if (input instanceof HTMLInputElement && input.type === 'checkbox' && input.closest('[data-checklist-item-id]')) emit({ kind: 'checkbox-change', ...state() })
    }, true)
    let previous = ''
    new MutationObserver(() => {
      const current = state(), serialized = JSON.stringify(current)
      if (serialized !== previous) { previous = serialized; emit({ kind: 'ui-state', ...current }) }
    }).observe(document, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'disabled'] })
    // pending tracks created transactions only. An outstanding db-open or
    // manager queue can still exist even when this array is empty.
    for (const event of ['beforeunload', 'pagehide']) window.addEventListener(event, () => emit({ kind: event, pending: [...pending], ui: state() }))
    emit({ kind: 'document-init' })
  }, { prefix, started })
  return async () => {
    log({ kind: 'postmortem-start', result: info.status })
    // This read is AFTER the original test/assertion, never before its reload.
    try {
      const result = await page.evaluate(async target => {
        const hash = (value: string) => { let result = 2166136261; for (const c of value) result = Math.imul(result ^ c.charCodeAt(0), 16777619); return (result >>> 0).toString(16).padStart(8, '0') }
        const element = [...document.querySelectorAll<HTMLElement>('[data-checklist-item-id]')].find(element => element.dataset.checklistItemId === target.itemId)
        const input = element?.querySelector<HTMLInputElement>('input[type="checkbox"]')
        const ui = input ? { itemHash: hash(target.itemId), checked: input.checked, disabled: input.disabled, sameItem: true } : null
        const name = 'travelpilot-preview-v2-user-state'
        if (!(await indexedDB.databases()).some(database => database.name === name)) return { ui, databaseMissing: true }
        const request = indexedDB.open(name)
        const db = await new Promise<IDBDatabase>((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(new Error(request.error?.name)) })
        try {
          const tx = db.transaction('checklistState'), request = tx.objectStore('checklistState').get(['local-demo', target.tripId, target.itemId])
          const stored = await new Promise<any>((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(new Error(request.error?.name)) })
          return { ui, db: name, expected: { scope: 'local-demo', tripHash: hash(target.tripId), itemHash: hash(target.itemId) }, stored: stored ? { scope: stored.scope === 'local-demo' ? 'local-demo' : 'redacted-owner', owner: stored.ownerId === null ? 'null' : 'redacted', sameTrip: stored.tripId === target.tripId, sameItem: stored.checklistItemId === target.itemId, checked: stored.checked } : null }
        } finally { db.close() }
      }, target)
      log({ kind: 'postmortem-readback', ...result })
    } catch { log({ kind: 'postmortem-unavailable' }) }
    page.off('console', consoleEvent); page.reload = originalReload
    const directory = join(process.cwd(), 'work/checklist-durability')
    await mkdir(directory, { recursive: true })
    await writeFile(join(directory, `${info.project.name}-${info.title.startsWith('stale') ? 'stale' : 'warm'}-worker${info.workerIndex}.json`), JSON.stringify({ title: info.title, project: info.project.name, status: info.status, browser: page.context().browser()?.version(), events }, null, 2))
  }
}
