import { test as base, expect } from './fixtures'
import { openDemoChecklist, installChecklistFaults, faultMode, holdChecklistLock, pendingIntents, storedDemoItem, demoChecklistItem, demoTripId } from './previewChecklistFaults'
import { readFileSync, readdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'

const test = base.extend<{ previewNetwork: void }>({
  previewNetwork: [async ({ context }, use) => {
    const external: string[] = []
    context.on('request', request => {
      if (!request.frame().url().includes('/travelpilot-poc/review/')) return
      if (!['http://127.0.0.1:4173', 'http://127.0.0.1:4174'].includes(new URL(request.url()).origin)) external.push(new URL(request.url()).origin)
    })
    try { await use() } finally { expect(external, 'Preview must not request Supabase or other live services').toEqual([]) }
  }, { auto: true }],
})

for (const port of [4173, 4174]) {
  const site = `http://127.0.0.1:${port}/travelpilot-poc/review/`
  test(`Preview ${port} accepted intent survives immediate reload before IDB open`, async ({ page }) => {
    await installChecklistFaults(page); await openDemoChecklist(page, site); await holdChecklistLock(page)
    await page.evaluate(() => sessionStorage.setItem('preview-test-hold-recovery', 'yes'))
    await page.getByRole('checkbox').first().check()
    await page.reload()
    await expect(page.getByRole('checkbox').first()).toBeDisabled()
    await expect(page.getByTestId('preview-checklist-durability')).toHaveText('正在恢復本機清單…')
    await page.evaluate(() => (window as any).releaseChecklistLock())
    await expect(page.getByRole('checkbox').first()).toBeChecked()
    await expect.poll(() => storedDemoItem(page)).toEqual({ tripId: demoTripId, itemId: demoChecklistItem.id, checked: true })
    await expect.poll(() => pendingIntents(page)).toEqual([])
  })
  test(`Preview ${port} accepted intent survives closing the pending document`, async ({ page, context }) => {
    await installChecklistFaults(page); await openDemoChecklist(page, site); await holdChecklistLock(page)
    await page.getByRole('checkbox').first().check(); await page.close()
    const restored = await context.newPage()
    try { await openDemoChecklist(restored, site); await expect(restored.getByRole('checkbox').first()).toBeChecked() } finally { await restored.close() }
  })
  test(`Preview ${port} pending real IDB transaction replays before ready after reload`, async ({ page }) => {
    await installChecklistFaults(page); await openDemoChecklist(page, site); await faultMode(page, 'pending-write')
    await page.getByRole('checkbox').first().check()
    await expect.poll(() => page.evaluate(() => (window as any).checklistFault.reached)).toBe(true)
    expect(await page.evaluate(() => (window as any).checklistFault.completed)).toBe(0)
    expect((await pendingIntents(page))[0].checked).toBe(true)
    await expect(page.getByTestId('preview-checklist-durability')).toHaveText('正在儲存清單…')
    await page.reload()
    await expect(page.getByRole('checkbox').first()).toBeChecked()
    await expect(page.getByTestId('preview-checklist-durability')).toHaveText('已儲存此裝置')
    await expect.poll(() => pendingIntents(page)).toEqual([])
  })
  test(`Preview ${port} committed state survives reload with no pending journal`, async ({ page }) => {
    await openDemoChecklist(page, site); await page.getByRole('checkbox').first().check()
    await expect(page.getByTestId('preview-checklist-durability')).toHaveText('已儲存此裝置')
    expect(await pendingIntents(page)).toEqual([])
    await page.reload(); await expect(page.getByRole('checkbox').first()).toBeChecked()
  })
  test(`Preview ${port} delayed reset acknowledgements preserve newer recheck and other items`, async ({ page }) => {
    await installChecklistFaults(page); await openDemoChecklist(page, site)
    await page.getByRole('checkbox').first().check(); await expect(page.getByTestId('preview-checklist-durability')).toHaveText('已儲存此裝置')
    await faultMode(page, 'pending-write')
    page.once('dialog', dialog => dialog.accept()); await page.getByRole('button', { name: /^全部取消勾選：/ }).first().click()
    await expect.poll(() => page.evaluate(() => (window as any).checklistFault.reached)).toBe(true)
    await page.getByRole('checkbox').first().check()
    await page.reload()
    await expect(page.getByRole('checkbox').first()).toBeChecked()
    await expect(page.getByRole('checkbox').nth(1)).not.toBeChecked()
    await expect.poll(() => pendingIntents(page)).toEqual([])
    await expect.poll(() => storedDemoItem(page)).toEqual({ tripId: demoTripId, itemId: demoChecklistItem.id, checked: true })
  })
  for (const mode of ['open-error', 'abort']) test(`Preview ${port} ${mode} retains intent, reports failure and recovers on reload`, async ({ page }) => {
    await installChecklistFaults(page); await openDemoChecklist(page, site); await faultMode(page, mode)
    await page.getByRole('checkbox').first().check()
    await expect(page.getByTestId('preview-checklist-durability')).toContainText('儲存失敗')
    expect((await pendingIntents(page))[0].checked).toBe(true)
    await page.reload(); await expect(page.getByRole('checkbox').first()).toBeChecked()
    await expect(page.getByTestId('preview-checklist-durability')).toHaveText('已儲存此裝置')
  })
  for (const mode of ['quota', 'blocked']) test(`Preview ${port} ${mode} synchronous storage rejects unchecked-to-checked acknowledgement`, async ({ page }) => {
    await installChecklistFaults(page); await openDemoChecklist(page, site); await faultMode(page, mode)
    // click() deliberately observes rejection; check() would itself assert the change succeeded.
    await page.getByRole('checkbox').first().click()
    await expect(page.getByRole('checkbox').first()).not.toBeChecked()
    await expect(page.getByTestId('preview-checklist-durability')).toContainText('儲存失敗')
    expect(await pendingIntents(page)).toEqual([])
    expect(await storedDemoItem(page)).toBeNull()
    await page.reload(); await expect(page.getByRole('checkbox').first()).not.toBeChecked()
  })
  test(`Preview ${port} old-format malformed intent fails closed before ready`, async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('travelpilot-preview.checklist-intent.v0.invalid', '{"format":0}'))
    await page.goto(`${site}#/trip/demo-trip/info`)
    await page.getByRole('button', { name: 'Checklist', exact: true }).click()
    await expect(page.getByTestId('preview-checklist-durability')).toContainText('儲存失敗')
    await expect(page.getByRole('checkbox').first()).toBeDisabled()
    expect(await page.evaluate(() => localStorage.getItem('travelpilot-preview.checklist-intent.v0.invalid'))).toBe('{"format":0}')
  })
}

test('two same-origin Preview tabs converge without touching a normal POC tab', async ({ page, context }) => {
  const site = 'http://127.0.0.1:4173/travelpilot-poc/review/'
  await installChecklistFaults(page); await openDemoChecklist(page, site)
  const other = await context.newPage(), normal = await context.newPage()
  try {
    await normal.route('**/*', route => new URL(route.request().url()).origin === 'http://127.0.0.1:4173' ? route.continue() : route.fulfill({ json: [] }))
    await normal.goto('http://127.0.0.1:4173/travelpilot-poc/#/trip/demo-trip/info')
    await normal.getByRole('button', { name: 'Checklist', exact: true }).click(); await normal.getByRole('checkbox').first().check()
    await normal.evaluate(() => localStorage.setItem('travelpilot.font-size', 'large'))
    await openDemoChecklist(other, site)
    await holdChecklistLock(page)
    await page.getByRole('checkbox').first().check()
    await expect(other.getByRole('checkbox').first()).toBeChecked()
    other.once('dialog', dialog => dialog.accept()); await other.getByRole('button', { name: /^全部取消勾選：/ }).first().click()
    await expect(page.getByRole('checkbox').first()).not.toBeChecked()
    await page.getByRole('checkbox').first().check()
    await page.evaluate(() => (window as any).releaseChecklistLock())
    await expect(other.getByRole('checkbox').first()).toBeChecked()
    await expect.poll(() => pendingIntents(page)).toEqual([])
    await page.reload(); await expect(page.getByRole('checkbox').first()).toBeChecked()
    await other.reload(); await expect(other.getByRole('checkbox').first()).toBeChecked()
    await normal.reload(); await expect(normal.getByRole('checkbox').first()).toBeChecked()
    expect(await normal.evaluate(() => localStorage.getItem('travelpilot.font-size'))).toBe('large')
    // Normal Clear must not remove an accepted but NOT-yet-IDB-committed intent.
    await holdChecklistLock(page)
    await page.getByRole('checkbox').first().uncheck()
    await normal.getByRole('link', { name: '設定', exact: true }).click()
    normal.once('dialog', dialog => dialog.accept()); await normal.getByRole('button', { name: '清除本機離線資料', exact: true }).click()
    await expect(normal.getByText('本機離線資料已清除。', { exact: true })).toBeVisible()
    expect((await pendingIntents(page)).some(intent => intent.itemId === demoChecklistItem.id && !intent.checked)).toBe(true)
    await page.reload(); await expect(page.getByRole('checkbox').first()).not.toBeChecked()
    await other.reload(); await expect(other.getByRole('checkbox').first()).not.toBeChecked()
  } finally { await other.close(); await normal.close() }
})
test('concurrent Preview tab operations converge by explicit revision and operation ID', async ({ page, context }) => {
  const site = 'http://127.0.0.1:4173/travelpilot-poc/review/'
  await installChecklistFaults(page); await openDemoChecklist(page, site)
  const other = await context.newPage()
  try {
    await openDemoChecklist(other, site); await holdChecklistLock(page)
    other.once('dialog', dialog => dialog.accept())
    // Two genuine opposing clicks can supersede each other's UI state before Playwright check() finishes.
    // Use a native user click and assert both accepted intents plus the final deterministic winner.
    await Promise.all([page.getByRole('checkbox').first().click(), other.getByRole('button', { name: /^全部取消勾選：/ }).first().click()])
    const records = (await pendingIntents(page)).filter(row => row.itemId === demoChecklistItem.id)
    expect(records).toHaveLength(2)
    expect(records.every(row => row.tripId === demoTripId && row.itemId === demoChecklistItem.id)).toBe(true)
    expect(records.map(row => row.checked).sort()).toEqual([false, true])
    expect(new Set(records.map(row => row.operationId)).size).toBe(2)
    expect(records.every(row => Number.isSafeInteger(row.revision) && row.revision >= 0)).toBe(true)
    const winner = records.sort((a, b) => a.revision - b.revision || (a.operationId < b.operationId ? -1 : a.operationId > b.operationId ? 1 : 0)).at(-1)!
    await page.evaluate(() => (window as any).releaseChecklistLock())
    await expect(page.getByRole('checkbox').first()).toBeChecked({ checked: winner.checked })
    await expect(other.getByRole('checkbox').first()).toBeChecked({ checked: winner.checked })
    await expect.poll(() => pendingIntents(page)).toEqual([])
    await expect.poll(() => storedDemoItem(page)).toEqual({ tripId: demoTripId, itemId: demoChecklistItem.id, checked: winner.checked })
    await page.reload(); await expect(page.getByRole('checkbox').first()).toBeChecked({ checked: winner.checked })
    await other.reload(); await expect(other.getByRole('checkbox').first()).toBeChecked({ checked: winner.checked })
  } finally { await other.close() }
})
test('Preview saving and failure messages remain readable at Large font', async ({ page }, info) => {
  await page.addInitScript(() => localStorage.setItem('travelpilot-preview.font-size', 'large'))
  await installChecklistFaults(page); await openDemoChecklist(page, 'http://127.0.0.1:4173/travelpilot-poc/review/')
  await holdChecklistLock(page); await page.getByRole('checkbox').first().check()
  await expect(page.getByTestId('preview-checklist-durability')).toHaveText('正在儲存清單…')
  await page.locator('main').evaluate(node => { node.scrollTop = 0 })
  await page.screenshot({ path: info.outputPath('preview-saving-large.png') })
  await page.evaluate(() => (window as any).releaseChecklistLock())
  await expect(page.getByTestId('preview-checklist-durability')).toHaveText('已儲存此裝置')
  await faultMode(page, 'quota'); await page.getByRole('checkbox').first().click()
  await expect(page.getByRole('checkbox').first()).toBeChecked()
  await expect(page.getByTestId('preview-checklist-durability')).toContainText('儲存失敗')
  await page.locator('main').evaluate(node => { node.scrollTop = 0 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  expect(await page.locator('main').evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true)
  await expect(page.locator('.app-status')).toBeVisible()
  await page.screenshot({ path: info.outputPath('preview-failure-large.png') })
})
test('Preview durability source/unit and immutable payload boundary checks', () => {
  expect(execFileSync('node', ['tests/previewChecklistIntentChecks.mjs'], { encoding: 'utf8' })).toContain('pass 7')
  const normal = readdirSync('dist/assets').filter(file => file.endsWith('.js')).map(file => readFileSync(`dist/assets/${file}`, 'utf8')).join('\n')
  expect(normal).not.toContain('travelpilot-preview.checklist-intent.')
  for (const [file, hash] of [['docs/proposals/jp2027-schema6-unpublished-draft.json','fe4f2dd90a2f3cb8c182ea93e7c231b2e30718af362cb2f6e590534ce560c458'],['tests/fixtures/japan2027-schema5.json','09a0bc1a5b75e50b579fd5ec4596912026cf8311fdf262df0c14ca6e235ea57e']]) expect(createHash('sha256').update(readFileSync(file)).digest('hex')).toBe(hash)
})
