import { test, expect, supabaseOrigin, testUser } from './fixtures'
import { cityTrip } from '../src/data/demoTrips/cityTrip'
import { roadTrip } from '../src/data/demoTrips/roadTrip'
import { compareChanges, nextMutationTime } from '../src/data/checklistState'
import { compareAppVersions, resolveAppUpdate } from '../src/data/appVersions'
import { validateTripSnapshot } from '../src/data/schema/trip'
import { cacheContents, seedAuth } from './tripFixtures'
import { mockChecklistBackend, openOwned, checks, settings, login, userContents, putUserRows, localRow, serverRow, syncCity, syncRoad, itemIds, changeAccount } from './checklistFixtures'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import type { Page } from '@playwright/test'

async function local(page: Page, slug = 'demo-trip') {
  await page.goto(`#/trip/${slug}/info`)
  await expect(checks(page).first()).toBeEnabled()
}
async function clean(page: Page) { await expect.poll(async () => await page.locator('.checklist-sync-label').allTextContents()).not.toContain('待同步'); await expect.poll(async () => (await userContents(page)).rows.filter((row) => row.dirty).length).toBe(0) }
async function stateSaved(page: Page, checked = true) { await expect.poll(async () => (await userContents(page)).rows[0]?.checked).toBe(checked) }

for (const snapshot of [cityTrip, roadTrip]) {
  test(`${snapshot.trip.slug} accessible optimistic checklists persist offline without any checklist API`, async ({ page, context }) => {
    await seedAuth(page)
    const requests: string[] = []; page.on('request', (request) => { if (request.url().includes('/v2_checklist_state')) requests.push(request.url()) })
    const definitions = JSON.stringify(snapshot.checklists)
    await local(page, snapshot.trip.slug)
    await expect(checks(page)).toHaveCount(itemIds(snapshot).length)
    for (const item of snapshot.checklists.flatMap((list) => list.groups.flatMap((group) => group.items))) await expect(page.getByRole('checkbox', { name: item.label, exact: true })).toBeVisible()
    await context.setOffline(true)
    await checks(page).first().check(); await expect(checks(page).first()).toBeChecked()
    await expect(page.locator('.checklist-progress').first()).toContainText(`完成：1/${itemIds(snapshot.checklists.length === 1 ? snapshot : { ...snapshot, checklists: [snapshot.checklists[0]] }).length}`)
    await expect(page.locator('.checklist-progress').first()).toContainText('只儲存在此裝置')
    await stateSaved(page)
    const before = await userContents(page)
    expect(before.rows[0]).toMatchObject({ ownerId: null, tripId: snapshot.trip.id, checked: true, dirty: false })
    expect(before.rows[0].deviceId).toMatch(/^[0-9a-f-]{36}$/)
    await context.setOffline(false); await page.reload(); await expect(checks(page).first()).toBeChecked()
    const after = await userContents(page); expect(after.rows[0].deviceId).toBe(before.rows[0].deviceId)
    expect(JSON.stringify(snapshot.checklists)).toBe(definitions); expect(validateTripSnapshot(snapshot).valid).toBe(true)
    expect(requests).toEqual([])
  })
}
test('rapid toggles and frozen clock keep latest durable value and strictly increasing device timestamps', async ({ page }) => {
  await local(page)
  await page.clock.setFixedTime(new Date('2026-10-08T00:00:00Z'))
  const times: string[] = []
  for (const checked of [true, false, true, false, true]) {
    await checks(page).first().setChecked(checked); await stateSaved(page, checked)
    times.push((await userContents(page)).rows[0].clientUpdatedAt)
  }
  expect(times.every((time, i) => !i || Date.parse(time) > Date.parse(times[i - 1]))).toBe(true)
  const device = (await userContents(page)).rows[0].deviceId
  await page.reload(); await expect(checks(page).first()).toBeChecked()
  await checks(page).first().uncheck(); await stateSaved(page, false)
  const last = (await userContents(page)).rows[0]; expect(Date.parse(last.clientUpdatedAt)).toBeGreaterThan(Date.parse(times.at(-1)!)); expect(last.deviceId).toBe(device)
})
test('blocked IndexedDB keeps usable session state with honest persistence warning', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(window, 'indexedDB', { get() { throw Error('Test blocked storage') } }) })
  await local(page); await checks(page).first().check(); await expect(checks(page).first()).toBeChecked()
  await expect(page.getByRole('alert')).toContainText('本次更改只保留於本次使用')
  await settings(page); await expect(page.getByText('暫時未能讀取本機旅程。')).toBeVisible()
  await page.getByRole('button', { name: '返回上一頁' }).click(); await expect(checks(page).first()).toBeChecked()
})
test('local checklist keys isolate trips and fixtures never acquire checked state', async ({ page }) => {
  await local(page); await checks(page).first().check(); await stateSaved(page)
  await local(page, 'demo-road-trip'); await expect(checks(page).first()).not.toBeChecked()
  await checks(page).first().check()
  await expect.poll(async () => (await userContents(page)).rows.length).toBe(2)
  await local(page); await expect(checks(page).first()).toBeChecked()
  expect((await userContents(page)).rows.map((row) => row.tripId).sort()).toEqual([cityTrip.trip.id, roadTrip.trip.id].sort())
  expect(JSON.stringify([cityTrip,roadTrip])).not.toMatch(/"checked"|"dirty"|clientUpdatedAt/)
})
test('confirmed reset touches only selected checklist and cancel leaves state unchanged', async ({ page }) => {
  await local(page, 'demo-road-trip')
  await checks(page).first().check(); await checks(page).last().check()
  await expect.poll(async () => (await userContents(page)).rows.length).toBe(2)
  const lists = page.locator('.checklist-definition')
  page.once('dialog', (dialog) => dialog.dismiss()); await lists.first().getByRole('button', { name: /全部取消勾選/ }).click()
  await expect(checks(page).first()).toBeChecked()
  page.once('dialog', (dialog) => dialog.accept()); await lists.first().getByRole('button', { name: /全部取消勾選/ }).click()
  await expect(lists.first().getByRole('checkbox').first()).not.toBeChecked(); await expect(checks(page).last()).toBeChecked()
  await expect(lists.first()).toContainText('完成：0/4'); await expect(lists.last()).toContainText('完成：1/1')
  await expect.poll(async () => (await userContents(page)).rows.length).toBe(5)
})
test('owned trip pulls remote values scoped to owner and trip, recording actual successful sync', async ({ page }) => {
  const backend = await mockChecklistBackend(page); backend.rows = [serverRow(syncCity)]
  await openOwned(page); await expect(checks(page).first()).toBeChecked()
  await clean(page); await expect(page.locator('.checklist-progress')).toContainText('已同步')
  expect(backend.batches).toEqual([]); expect(backend.pulls).toEqual([syncCity.trip.id])
  await settings(page); await expect(page.getByTestId('last-checklist-sync')).toContainText('上次清單同步：')
  expect((await userContents(page)).sync[0].lastSuccessfulAt).toBeTruthy()
  await expect(page.getByTestId('pending-sync-count')).toHaveText('待同步更改：0')
})
test('local changes batch canonical rows, never write server timestamp, and final pull cleans queue', async ({ page }) => {
  const backend = await mockChecklistBackend(page); await openOwned(page)
  // Issue both changes in one browser turn: separate auto-scrolling actions can
  // exceed the existing debounce and legitimately form separate batches.
  await checks(page).evaluateAll((inputs) => {
    (inputs[0] as HTMLInputElement).click()
    ;(inputs[inputs.length - 1] as HTMLInputElement).click()
  })
  await expect(checks(page).first()).toBeChecked(); await expect(checks(page).last()).toBeChecked()
  await expect.poll(() => backend.batches.length).toBe(1); await clean(page)
  expect(backend.batches[0]).toHaveLength(2); expect(backend.pulls.length).toBeGreaterThanOrEqual(2)
  const rows = (await userContents(page)).rows
  expect(rows.every((row) => row.dirty === false && row.checked && row.serverUpdatedAt)).toBe(true)
  expect(new Set(rows.map((row) => row.deviceId)).size).toBe(1)
  expect(new Set(rows.map((row) => row.clientUpdatedAt)).size).toBe(2)
})
test('network failures retain pending value across reload, online retry then synchronizes', async ({ page, context }) => {
  const backend = await mockChecklistBackend(page); backend.fail = true; await openOwned(page)
  await checks(page).first().check(); await stateSaved(page)
  await expect(page.locator('.checklist-progress')).toContainText('同步稍後重試')
  await page.reload(); await expect(checks(page).first()).toBeChecked()
  await settings(page); await expect(page.getByTestId('pending-sync-count')).toHaveText('待同步更改：1')
  await expect(page.getByTestId('last-checklist-sync')).toHaveText('尚未有清單同步紀錄')
  await expect(page.locator('body')).not.toContainText('PRIVATE_RAW_SERVER_ERROR')
  await context.setOffline(true); backend.fail = false; await context.setOffline(false)
  await clean(page); expect(backend.rows[0].checked).toBe(true)
  await expect(page.getByTestId('pending-sync-count')).toHaveText('待同步更改：0')
})
for (const signal of ['focus', 'visibility', 'manual'] as const) {
  test(`${signal} opportunity reconciles a newer change from another device`, async ({ page }) => {
    const backend = await mockChecklistBackend(page); await openOwned(page)
    await expect.poll(() => backend.pulls.length).toBe(1)
    backend.rows = [serverRow(syncCity, 0, '2090-01-01T00:00:00Z', true)]
    if (signal === 'manual') { await settings(page); await page.getByRole('button', { name: '立即同步' }).click(); await page.getByRole('button', { name: '返回上一頁' }).click() }
    else await page.evaluate((signal) => signal === 'focus' ? window.dispatchEvent(new Event('focus')) : document.dispatchEvent(new Event('visibilitychange')), signal)
    await expect(checks(page).first()).toBeChecked(); await clean(page); expect(backend.batches).toHaveLength(0)
  })
}
test('hidden tabs do not poll; visible conservative timer pulls remote changes', async ({ page }) => {
  await page.clock.install()
  const backend = await mockChecklistBackend(page); await openOwned(page); await expect.poll(() => backend.pulls.length).toBe(1)
  await page.evaluate(() => Object.defineProperty(document,'visibilityState',{value:'hidden',configurable:true}))
  await page.clock.fastForward(31000); expect(backend.pulls).toHaveLength(1)
  backend.rows = [serverRow(syncCity)]
  await page.evaluate(() => Object.defineProperty(document,'visibilityState',{value:'visible',configurable:true}))
  await page.clock.fastForward(31000); await page.clock.fastForward(1000)
  await expect(checks(page).first()).toBeChecked()
})
for (const [name, localTime, localDevice, remoteTime, remoteDevice, expected] of [
  ['newer local wins', '2090-01-01T00:00:01Z','A','2090-01-01T00:00:00Z','Z',true],
  ['newer remote wins', '2090-01-01T00:00:00Z','Z','2090-01-01T00:00:01Z','A',false],
  ['larger local device tie wins', '2090-01-01T00:00:00Z','B','2090-01-01T00:00:00Z','A',true],
  ['larger remote device tie wins', '2090-01-01T00:00:00Z','A','2090-01-01T00:00:00Z','B',false],
] as const) {
  test(`conflict reconciliation: ${name}`, async ({ page, context }) => {
    const backend = await mockChecklistBackend(page); await openOwned(page); await expect.poll(() => backend.pulls.length).toBe(1)
    await context.setOffline(true)
    await putUserRows(page, [localRow(serverRow(syncCity,0,localTime,true,localDevice))])
    backend.rows = [serverRow(syncCity,0,remoteTime,false,remoteDevice)]
    await context.setOffline(false)
    await expect.poll(async () => (await userContents(page)).rows[0]?.dirty).toBe(false)
    await expect(checks(page).first()).toHaveJSProperty('checked', expected)
    expect(backend.batches.length).toBe(expected ? 1 : 0)
    expect(backend.rows[0].checked).toBe(expected)
  })
}
test('server rejects a race-stale upsert; mandatory final pull reconciles the actual winner', async ({ page }) => {
  const backend = await mockChecklistBackend(page); await openOwned(page)
  backend.beforePush = () => { backend.rows = [serverRow(syncCity, 0, '2099-01-01T00:00:00Z', false, 'atomic-server-winner')] }
  await checks(page).first().check(); await expect.poll(() => backend.batches.length).toBe(1)
  await expect(checks(page).first()).not.toBeChecked(); await clean(page)
  const record = (await userContents(page)).rows[0]
  expect(record.deviceId).toBe('atomic-server-winner'); expect(record.clientUpdatedAt).toBe('2099-01-01T00:00:00Z')
  expect(backend.pulls.length).toBeGreaterThanOrEqual(2)
})
test('late pull cannot undo a newer local edit made while the request is in flight', async ({ page }) => {
  const backend = await mockChecklistBackend(page)
  let release!: () => void; backend.gate = new Promise<void>((resolve) => { release = resolve })
  backend.rows = [serverRow(syncCity,0,'2020-01-01T00:00:00Z',false)]
  await openOwned(page); await expect.poll(() => backend.pulls.length).toBe(1)
  await checks(page).first().check(); await stateSaved(page); release(); backend.gate = undefined
  await clean(page); await expect(checks(page).first()).toBeChecked(); expect(backend.rows[0].checked).toBe(true)
})
test('logout retains cache/queue; signed-out offline edits sync only after original owner logs back in', async ({ page, context }) => {
  const backend = await mockChecklistBackend(page); await openOwned(page); await expect.poll(() => backend.pulls.length).toBe(1)
  const beforeCache = await cacheContents(page)
  await settings(page); await page.getByRole('button', { name: '登出', exact: true }).click()
  await expect(page.getByRole('button', { name: '登入', exact: true })).toBeVisible()
  await page.getByRole('button', { name: '返回上一頁' }).click(); await expect(page.getByTestId('trip-source')).toContainText('cache')
  await context.setOffline(true); await checks(page).first().check(); await stateSaved(page)
  expect((await userContents(page)).rows[0]).toMatchObject({ ownerId:testUser.id,dirty:true }); expect(await cacheContents(page)).toEqual(beforeCache)
  const previousPulls = backend.pulls.length; await context.setOffline(false); await settings(page)
  await expect(page.getByRole('button', { name: '立即同步' })).toBeDisabled(); expect(backend.pulls.length).toBe(previousPulls)
  await login(page); await clean(page); expect(backend.batches[0][0].user_id).toBe(testUser.id)
  await page.getByRole('button', { name: '返回上一頁' }).click(); await expect(checks(page).first()).toBeChecked()
})
test('a different authenticated owner never reads or uploads another account queue or cache', async ({ page }) => {
  await page.addInitScript(()=>{
    const original=IDBObjectStore.prototype.getAll
    const capture=window as typeof window & { scopeReads?:unknown[]; captureScopes?:boolean }
    IDBObjectStore.prototype.getAll=function(...args:Parameters<IDBObjectStore['getAll']>){
      if(capture.captureScopes && this.transaction.db.name==='travelpilot-v2-user-state' && this.name==='checklistState') {
        capture.scopeReads?.push(args[0] instanceof IDBKeyRange ? args[0].lower[0] : 'unscoped')
      }
      return original.apply(this,args)
    }
  })
  const backend = await mockChecklistBackend(page); backend.fail = true; await openOwned(page)
  await checks(page).first().check(); await stateSaved(page)
  const original = (await userContents(page)).rows[0]
  const other = '00000000-0000-4000-8000-000000000099'; await changeAccount(page,other); backend.owner = other
  await page.goto('#/settings'); await page.reload(); await expect(page.getByText('other@example.invalid')).toBeVisible(); backend.fail = false
  await expect(page.getByRole('button',{name:'清除本機離線資料',exact:true})).toBeEnabled()
  await page.evaluate(()=>{const capture=window as typeof window & { scopeReads?:unknown[]; captureScopes?:boolean };capture.scopeReads=[];capture.captureScopes=true})
  await page.getByRole('button', { name: '立即同步' }).click()
  await expect.poll(async()=>page.evaluate(()=>(window as typeof window & {scopeReads:unknown[]}).scopeReads.length)).toBeGreaterThan(0)
  const reads=await page.evaluate(()=>{const capture=window as typeof window & {scopeReads:unknown[];captureScopes:boolean};capture.captureScopes=false;return capture.scopeReads})
  expect(reads.every(scope=>scope===other||scope==='local-demo')).toBe(true)
  await expect(page.getByTestId('pending-sync-count')).toHaveText('待同步更改：0')
  await expect(page.getByText('此裝置尚未下載旅程。')).toBeVisible()
  expect(backend.batches).toEqual([]); expect((await userContents(page)).rows[0]).toEqual(original)
  await expect(page.locator('body')).not.toContainText(testUser.id)
})
test('two remote trips isolate local values, versioned caches, queues and server row keys', async ({ page }) => {
  const backend = await mockChecklistBackend(page); await openOwned(page)
  await checks(page).first().check(); await clean(page)
  await page.goto(`#/trip/${syncRoad.trip.slug}/info`); await expect(checks(page).first()).toBeEnabled(); await expect(checks(page).first()).not.toBeChecked()
  await checks(page).last().check(); await expect.poll(() => backend.rows.length).toBe(2); await clean(page)
  await page.goto(`#/trip/${syncCity.trip.slug}/info`); await expect(checks(page).first()).toBeChecked(); await expect(checks(page).last()).not.toBeChecked()
  const rows = (await userContents(page)).rows; expect(new Set(rows.map((row)=>row.tripId)).size).toBe(2)
  expect((await cacheContents(page)).versions).toHaveLength(2)
  await settings(page); await expect(page.locator('.cached-trip-list li')).toHaveCount(2)
  for (const snapshot of [syncCity,syncRoad]) {
    const card = page.locator('.cached-trip-list li').filter({ hasText:snapshot.trip.title })
    await expect(card).toContainText(`Trip Data Version：sync.${snapshot.trip.slug}.1`); await expect(card).toContainText('Trip Schema Version：4'); await expect(card).toContainText('下載時間：')
  }
})
test('orphan local/remote rows remain stored but never render or upload under current definitions', async ({ page, context }) => {
  const backend = await mockChecklistBackend(page); await openOwned(page); await expect.poll(() => backend.pulls.length).toBe(1)
  await context.setOffline(true)
  const orphan = { ...serverRow(syncCity), checklist_item_id:'removed-canonical-item' }
  await putUserRows(page,[localRow(orphan)]); backend.rows = [{ ...orphan,checked:false }]
  await context.setOffline(false); await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await expect.poll(()=>backend.pulls.length).toBeGreaterThan(1)
  expect(backend.batches).toEqual([]); await expect(checks(page)).toHaveCount(itemIds(syncCity).length)
  expect((await userContents(page)).rows[0]).toMatchObject({ checklistItemId:'removed-canonical-item',dirty:true })
})
test('remote reset uses ordinary batched mutations and never deletes rows or other checklists', async ({ page }) => {
  const backend = await mockChecklistBackend(page); backend.rows = [serverRow(syncRoad),serverRow(syncRoad,itemIds(syncRoad).length-1)]
  await openOwned(page,syncRoad); await expect(checks(page).first()).toBeChecked(); await expect(checks(page).last()).toBeChecked()
  page.once('dialog',(dialog)=>dialog.accept()); await page.locator('.checklist-definition').first().getByRole('button',{name:/全部取消勾選/}).click()
  await expect.poll(()=>backend.batches.length).toBe(1); await clean(page)
  expect(backend.batches[0]).toHaveLength(4); expect(backend.batches[0].every((row)=>!row.checked)).toBe(true)
  await expect(checks(page).last()).toBeChecked(); expect(backend.requests.some((request)=>request.method==='DELETE')).toBe(false)
})
test('two independent browser devices converge through deterministic remote state on focus', async ({ browser, page }) => {
  // The second context explicitly intercepts every Supabase boundary too.
  const backend = await mockChecklistBackend(page); await openOwned(page); await checks(page).first().check(); await clean(page)
  const context = await browser.newContext({ viewport:page.viewportSize()!,baseURL:'http://127.0.0.1:4173/travelpilot-poc/' })
  try {
    const second = await context.newPage(); const secondBackend = await mockChecklistBackend(second); secondBackend.rows = backend.rows
    await openOwned(second); await expect(checks(second).first()).toBeChecked(); await checks(second).first().uncheck(); await clean(second)
    const firstId = (await userContents(page)).rows[0].deviceId, secondId = (await userContents(second)).rows[0].deviceId
    expect(firstId).not.toBe(secondId)
    await page.evaluate(()=>window.dispatchEvent(new Event('focus'))); await expect(checks(page).first()).not.toBeChecked(); await clean(page)
    expect((await userContents(page)).rows[0].clientUpdatedAt).toBe((await userContents(second)).rows[0].clientUpdatedAt)
  } finally { await context.close() }
})

test('LWW helper matches SQL ordering including microseconds and monotonic clock rollback', () => {
  expect(nextMutationTime(10,20)).toBe(21); expect(nextMutationTime(20,20)).toBe(21)
  const tuple=(time:string,deviceId='A')=>({clientUpdatedAt:time,deviceId})
  expect(compareChanges(tuple('2026-01-01T00:00:00.000001Z'),tuple('2026-01-01T00:00:00.000002Z'))).toBe(-1)
  expect(compareChanges(tuple('2026-01-01T00:00:00Z','B'),tuple('2026-01-01T08:00:00+08:00','A'))).toBe(1)
  expect(compareChanges(tuple('2026-01-01T00:00:00Z'),tuple('2026-01-01T00:00:00Z'))).toBe(0)
})
test('safe version comparator treats prerelease numbers numerically and missing metadata neutrally', () => {
  expect(compareAppVersions('v2.0.0-poc.16','v2.0.0-poc.9')).toBe(1)
  expect(compareAppVersions('v2.0.0','v2.0.0-poc.16')).toBe(1)
  expect(compareAppVersions('garbage','v2.0.0-poc.16')).toBeUndefined()
  expect(resolveAppUpdate('v2.0.0-poc.16',['v2.0.0-poc.11'])).toEqual({state:'unsynced'})
})
test('source boundaries protect trip definitions, credentials, V1, navigation and server timestamps', () => {
  const files=(dir:string):string[]=>readdirSync(dir,{withFileTypes:true}).flatMap((entry)=>entry.isDirectory()?files(join(dir,entry.name)):[join(dir,entry.name)])
  for(const path of ['src/app/ChecklistSync.tsx','src/components/UpdatePanel.tsx','src/views/Settings.tsx','src/components/tripInfo/ChecklistDefinitions.tsx',...files('src/services'),...files('src/offline')]) {
    const source=readFileSync(path,'utf8')
    expect(source).not.toMatch(/sb_secret_|service_role|trip_checklist_state|trip_checklist_shared|trip_sync_config|\.channel\(|postgres_changes|demo-road-trip|demo-trip|Japan|Shirakawa|Bangkok|Hokkaido/)
  }
  const push=readFileSync('src/services/checklists.ts','utf8').split('export async function pushChecklist')[1]
  expect(push).not.toMatch(/\bupdated_at:|email|password|label|title/)
  expect(readFileSync('src/services/checklistSync.ts','utf8')).not.toMatch(/list\.title\s*===|list\.type\s*===|supabase[^;]*\.delete\(/)
  expect(readFileSync('src/components/tripInfo/ChecklistDefinitions.tsx','utf8')).not.toMatch(/\.checked\s*=|\.sort\(/)
})

test('quota failure after initialization preserves immediate checkbox value and session warning',async({page})=>{
  await page.addInitScript(()=>{
    const original=IDBObjectStore.prototype.put
    IDBObjectStore.prototype.put=function(...args:Parameters<IDBObjectStore['put']>){
      if(this.name==='checklistState')throw new DOMException('Test full storage','QuotaExceededError')
      return original.apply(this,args)
    }
  })
  await local(page);await checks(page).first().check();await expect(checks(page).first()).toBeChecked()
  await expect(page.getByRole('alert')).toContainText('本次更改只保留於本次使用')
  expect((await userContents(page)).rows).toEqual([])
})
test('current definitions survive content version changes by stable ID while removed rows stay local only',async({page})=>{
  const snapshot=structuredClone(syncCity),backend=await mockChecklistBackend(page,[snapshot]);await openOwned(page,snapshot)
  await checks(page).first().check();await expect.poll(()=>backend.rows.length).toBe(1);await clean(page)
  const retainedId=snapshot.checklists[0].groups[0].items[0].id
  snapshot.checklists[0].groups[0].items[0].label='重新命名但保留穩定 ID'
  snapshot.checklists[0].groups[0].items.splice(1,1)
  backend.versions.set(snapshot.trip.id,'sync.changed.2')
  const batches=backend.batches.length
  await page.reload();await expect(page.getByRole('checkbox',{name:'重新命名但保留穩定 ID'})).toBeChecked()
  await expect(checks(page)).toHaveCount(1);expect((await userContents(page)).rows[0].checklistItemId).toBe(retainedId)
  expect(backend.batches.length).toBe(batches)
})
test('bounded canonical-item reads handle large definitions without server-limit truncation',async({page})=>{
  const snapshot=structuredClone(syncCity)
  snapshot.checklists[0].groups[0].items=Array.from({length:205},(_,i)=>({id:`large-proof-${i}`,label:`測試項目 ${i}`,order:i,notes:[]}))
  const backend=await mockChecklistBackend(page,[snapshot]);backend.rows=[serverRow(snapshot,204)]
  await openOwned(page,snapshot);await expect(checks(page)).toHaveCount(205);await expect(checks(page).last()).toBeChecked()
  await expect.poll(()=>backend.pulls.length).toBe(2)
})

test('blocked storage still presents valid remote winners in session with a visible warning',async({page})=>{
  await page.addInitScript(()=>{Object.defineProperty(window,'indexedDB',{get(){throw Error('Test blocked storage')}})})
  const backend=await mockChecklistBackend(page);backend.rows=[serverRow(syncCity)]
  await openOwned(page);await expect(checks(page).first()).toBeChecked()
  await expect(page.locator('.info-checklists').getByRole('alert')).toContainText('本次更改只保留於本次使用')
})
