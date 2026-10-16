import { expect, type Page } from '@playwright/test'
import { cityTrip } from '../src/data/demoTrips/cityTrip'
import { orderedDefinitions } from '../src/data/tripInformation'
export const demoChecklistItem = orderedDefinitions(orderedDefinitions(orderedDefinitions(cityTrip.checklists)[0].groups)[0].items)[0]
export const demoTripId = cityTrip.trip.id
export const previewDatabase = 'travelpilot-preview-v2-user-state'
export async function installChecklistFaults(page: Page) {
  await page.addInitScript(() => {
    const fault = { mode: 'none', reached: false, completed: 0, holding: false }
    Object.assign(window, { checklistFault: fault })
    if (sessionStorage.getItem('preview-test-hold-recovery') === 'yes') {
      sessionStorage.removeItem('preview-test-hold-recovery')
      const gate = new Promise<void>(resolve => { Object.assign(window, { releaseChecklistLock: resolve }) })
      void navigator.locks.request('travelpilot-preview.checklist-durability.v1', async () => { fault.holding = true; await gate })
    }
    const open = IDBFactory.prototype.open
    IDBFactory.prototype.open = function (...args) {
      if (args[0] === 'travelpilot-preview-v2-user-state' && fault.mode === 'open-error') { fault.reached = true; throw new DOMException('Controlled test fault', 'UnknownError') }
      return open.apply(this, args)
    }
    const put = IDBObjectStore.prototype.put
    IDBObjectStore.prototype.put = function (...args) {
      const request = put.apply(this, args)
      if (this.transaction.db.name === 'travelpilot-preview-v2-user-state' && this.name === 'checklistState') {
        const tx = this.transaction, store = this
        tx.addEventListener('complete', () => { fault.completed++ })
        if (fault.mode === 'abort') request.addEventListener('success', () => { fault.reached = true; tx.abort() }, { once: true })
        if (fault.mode === 'pending-write') {
          // Keep THIS real native transaction pending via requests, not sleeps.
          // Hard reload/close destroys the gate; startup then exercises recovery.
          const hold = () => { fault.reached = true; if (fault.mode === 'pending-write') store.get(['local-demo', '__controlled__', '__controlled__']).addEventListener('success', hold, { once: true }) }
          request.addEventListener('success', hold, { once: true })
        }
      }
      return request
    }
    const set = Storage.prototype.setItem
    Storage.prototype.setItem = function (key, value) {
      if (key.startsWith('travelpilot-preview.checklist-intent.') && ['quota', 'blocked'].includes(fault.mode)) {
        fault.reached = true; throw new DOMException('Controlled test fault', fault.mode === 'quota' ? 'QuotaExceededError' : 'SecurityError')
      }
      set.call(this, key, value)
    }
  })
}
export async function openDemoChecklist(page: Page, site: string) {
  await page.goto(`${site}#/trip/demo-trip/info`)
  await expect(page.getByTestId('trip-information')).toBeVisible()
  await page.getByRole('button', { name: 'Checklist', exact: true }).click()
  // Identity assertion supplements, never replaces, the original first() check.
  await expect(page.locator('[data-checklist-item-id]').first()).toHaveAttribute('data-checklist-item-id', demoChecklistItem.id)
  await expect(page.getByRole('checkbox').first()).toBeEnabled()
}
export async function faultMode(page: Page, mode: string) {
  await page.evaluate(mode => { (window as any).checklistFault.mode = mode }, mode)
}
export async function holdChecklistLock(page: Page) {
  await page.evaluate(() => {
    const gate = new Promise<void>(resolve => { Object.assign(window, { releaseChecklistLock: resolve }) })
    void navigator.locks.request('travelpilot-preview.checklist-durability.v1', async () => { (window as any).checklistFault.holding = true; await gate })
  })
  await expect.poll(() => page.evaluate(() => (window as any).checklistFault.holding)).toBe(true)
}
export const pendingIntents = (page: Page) => page.evaluate(() => Object.keys(localStorage).filter(key => key.startsWith('travelpilot-preview.checklist-intent.')).map(key => JSON.parse(localStorage.getItem(key)!)))
export async function storedDemoItem(page: Page) {
  return page.evaluate(async ({ tripId, itemId }) => {
    const request = indexedDB.open('travelpilot-preview-v2-user-state')
    const db = await new Promise<IDBDatabase>((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error) })
    try {
      const request = db.transaction('checklistState').objectStore('checklistState').get(['local-demo', tripId, itemId])
      const row = await new Promise<any>((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error) })
      return row ? { tripId: row.tripId, itemId: row.checklistItemId, checked: row.checked } : null
    } finally { db.close() }
  }, { tripId: demoTripId, itemId: demoChecklistItem.id })
}
