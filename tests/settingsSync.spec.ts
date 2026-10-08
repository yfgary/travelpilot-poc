import { test, expect, supabaseOrigin, testUser } from './fixtures'
import { readFileSync } from 'node:fs'
const APP_VERSION = `v${JSON.parse(readFileSync('package.json', 'utf8')).version}`
import { mockChecklistBackend, openOwned, checks, settings, userContents, syncCity, syncRoad } from './checklistFixtures'
import { cacheContents } from './tripFixtures'

const published = (app_version: string) => ({app_version,published:true,released_at:'2026-10-08T00:00:00Z'})
for (const [name, versions, expected] of [
  ['current plus older', [published(APP_VERSION),published('v2.0.0-poc.9')], '已是最新版本'],
  ['current and newer', [published(APP_VERSION),published('v2.0.0-poc.13')], '有較新版本：v2.0.0-poc.13'],
  ['missing current but older', [published('v2.0.0-poc.11')], '版本資料尚未同步'],
  ['missing current even with newer', [published('v2.0.0-poc.13')], '版本資料尚未同步'],
  ['empty metadata', [], '版本資料尚未同步'],
  ['invalid published response', [{app_version:'v3.0.0',published:false}], '版本資料暫時未能確認'],
] as const) {
  test(`manual update check: ${name}, stays on current app without reload or server write`, async ({page})=>{
    const requests:{method:string;path:string}[]=[]
    await page.route(`${supabaseOrigin}/rest/v1/v2_app_versions**`, async(route)=>{
      const request=route.request(),url=new URL(request.url()); requests.push({method:request.method(),path:url.pathname})
      expect(url.searchParams.get('published')).toBe('eq.true'); await route.fulfill({json:versions})
    })
    await page.goto('#/settings'); await expect(page.getByText('Supabase：已連線')).toBeVisible()
    let loads=0; page.on('load',()=>loads++)
    await page.getByRole('button',{name:'檢查更新',exact:true}).click()
    await expect(page.getByTestId('update-status')).toHaveText(expected)
    expect(requests.every(request=>request.method==='GET'&&request.path==='/rest/v1/v2_app_versions')).toBe(true)
    expect(loads).toBe(0); await expect(page).toHaveURL(/#\/settings$/)
    await expect(page.getByRole('status')).toContainText('App Version v2.0.0-poc.12')
    await expect(page.getByText('上次清單同步：',{exact:false})).toHaveCount(0)
  })
}
test('update failure displays generic unavailable and never shows raw backend text',async({page})=>{
  await page.route(`${supabaseOrigin}/rest/v1/v2_app_versions**`,route=>route.fulfill({status:503,json:{message:'RAW_PRIVATE_ERROR'}}))
  await page.goto('#/settings'); await page.getByRole('button',{name:'檢查更新',exact:true}).click()
  await expect(page.getByTestId('update-status')).toHaveText('版本資料暫時未能確認')
  await expect(page.locator('body')).not.toContainText('RAW_PRIVATE_ERROR')
})
test('automatic metadata-only preference persists, disabling stops auto checks while manual remains',async({page})=>{
  let queries=0
  await page.route(`${supabaseOrigin}/rest/v1/v2_app_versions**`,route=>{queries++;return route.fulfill({json:[published(APP_VERSION)]})})
  await page.goto('#/settings'); await expect(page.getByText('Supabase：已連線')).toBeVisible(); expect(queries).toBe(1)
  await page.getByRole('checkbox',{name:'自動檢查更新'}).check(); await expect(page.getByTestId('update-status')).toHaveText('已是最新版本'); expect(queries).toBe(2)
  await page.reload(); await expect(page.getByRole('checkbox',{name:'自動檢查更新'})).toBeChecked(); await expect(page.getByTestId('update-status')).toHaveText('已是最新版本'); expect(queries).toBe(4)
  await page.getByRole('checkbox',{name:'自動檢查更新'}).uncheck(); await page.reload()
  await expect(page.getByText('Supabase：已連線')).toBeVisible(); await expect(page.getByTestId('update-status')).toHaveText('尚未檢查版本資料'); expect(queries).toBe(5)
  await page.getByRole('button',{name:'檢查更新',exact:true}).click(); await expect(page.getByTestId('update-status')).toHaveText('已是最新版本'); expect(queries).toBe(6)
})
test('blocked localStorage still allows font/update controls without crashing',async({page})=>{
  await page.addInitScript(()=>{Storage.prototype.setItem=function(){throw Error('Test blocked storage')}})
  await page.goto('#/settings'); await page.getByRole('radio',{name:'大',exact:true}).check()
  await page.getByRole('checkbox',{name:'自動檢查更新'}).check()
  await expect(page.getByText('自動檢查偏好只適用於本次使用。')).toBeVisible()
  await expect(page.getByRole('radio',{name:'大',exact:true})).toBeChecked()
})
test('clear-local-data confirms, warns about pending loss, removes cache/state/meta without server delete or logout',async({page})=>{
  const backend=await mockChecklistBackend(page); backend.fail=true; await openOwned(page)
  await checks(page).first().check(); await expect.poll(async()=> (await userContents(page)).rows.length).toBe(1)
  await settings(page); await page.getByRole('radio',{name:'大',exact:true}).check()
  await expect(page.getByTestId('pending-sync-count')).toHaveText('待同步更改：1')
  await expect(page.locator('.cached-trip-list li')).toHaveCount(1)
  const before=await userContents(page),beforeCache=await cacheContents(page)
  page.once('dialog',async dialog=>{expect(dialog.message()).toContain('1 項尚未同步更改');await dialog.dismiss()})
  await page.getByRole('button',{name:'清除本機離線資料',exact:true}).click()
  expect(await userContents(page)).toEqual(before);expect(await cacheContents(page)).toEqual(beforeCache)
  page.once('dialog',async dialog=>{expect(dialog.message()).toContain('尚未同步');await dialog.accept()})
  await page.getByRole('button',{name:'清除本機離線資料',exact:true}).click()
  await expect(page.getByText('本機離線資料已清除。')).toBeVisible()
  const after=await userContents(page);expect(after.rows).toEqual([]);expect(after.sync).toEqual([])
  expect(after.meta).toEqual(before.meta)
  expect(await cacheContents(page)).toEqual({versions:[],pointers:[],device:[]})
  await expect(page.getByTestId('pending-sync-count')).toHaveText('待同步更改：0');await expect(page.getByTestId('last-checklist-sync')).toHaveText('尚未有清單同步紀錄')
  await expect(page.getByRole('button',{name:'登出',exact:true})).toBeVisible();await expect(page.getByRole('radio',{name:'大',exact:true})).toBeChecked()
  expect(backend.requests.some(request=>request.method==='DELETE')).toBe(false)
  await page.reload();await expect(page.getByRole('radio',{name:'大',exact:true})).toBeChecked();await expect(page.getByText(testUser.email)).toBeVisible()
})
test('clear local data removes successful sync metadata too, while original server row remains',async({page})=>{
  const backend=await mockChecklistBackend(page);await openOwned(page);await checks(page).first().check()
  await expect.poll(()=>backend.rows.length).toBe(1);await expect.poll(async()=>(await userContents(page)).sync.length).toBe(1)
  await settings(page);await expect(page.getByTestId('last-checklist-sync')).toContainText('上次清單同步：')
  page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'清除本機離線資料',exact:true}).click()
  await expect(page.getByText('本機離線資料已清除。')).toBeVisible();await expect(page.getByTestId('last-checklist-sync')).toHaveText('尚未有清單同步紀錄')
  expect(backend.rows).toHaveLength(1);expect(backend.rows[0].checked).toBe(true)
})
test('Settings stays usable at every width/font and retains account/language/version/status',async({page})=>{
  for(const font of ['小','中','大']){
    await page.goto('#/settings');await page.getByRole('radio',{name:font,exact:true}).check()
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
    expect(await page.locator('main').evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true)
    for(const panel of await page.locator('.settings-grid>.panel').all())expect(await panel.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true)
    await expect(page.getByLabel('密碼',{exact:true})).toHaveAttribute('type','password')
    await expect(page.getByRole('heading',{name:'語言',exact:true})).toBeVisible();await expect(page.getByText('繁體中文',{exact:true})).toBeVisible()
    await expect(page.getByRole('combobox')).toHaveCount(0);await expect(page.getByTestId('last-checklist-sync')).toHaveText('尚未有清單同步紀錄')
    await page.locator('main').evaluate(el=>{el.scrollTop=el.scrollHeight})
    const bottom=(await page.locator('.settings-grid>.panel').last().boundingBox())!,status=(await page.locator('.status-dock').boundingBox())!
    expect(bottom.y+bottom.height).toBeLessThanOrEqual(status.y)
    await expect(page.getByRole('status')).toBeVisible()
  }
})
test('visual QA checked city and road checklists, groups, progress and reset fit all widths',async({page})=>{
  if(page.viewportSize()!.width===320){await page.goto('#/settings');await page.getByRole('radio',{name:'大',exact:true}).check()}
  for(const slug of ['demo-trip','demo-road-trip']){
    await page.goto(`#/trip/${slug}/info`);await expect(checks(page).first()).toBeEnabled();await checks(page).first().check()
    await page.locator('.info-checklists').evaluate(el=>el.scrollIntoView({block:'start'}))
    expect(await page.locator('main').evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true)
    await page.screenshot({path:test.info().outputPath(`${slug}-checked.png`)})
    for(const label of await page.locator('.checklist-item').all())expect((await label.boundingBox())!.height).toBeGreaterThanOrEqual(44)
  }
})
test('visual QA Settings account/fonts/sync/cached trips/update/language and bottom status',async({page})=>{
  const backend=await mockChecklistBackend(page);backend.fail=true;await openOwned(page,syncRoad);await checks(page).first().check()
  await settings(page);if(page.viewportSize()!.width===320)await page.getByRole('radio',{name:'大',exact:true}).check()
  await expect(page.locator('.cached-trip-list')).toContainText(syncRoad.trip.title)
  await page.locator('main').evaluate(el=>{el.scrollTop=0})
  await page.screenshot({path:test.info().outputPath('settings-top.png')})
  for(const id of ['sync-title','offline-title','updates-title']){
    await page.locator(`#${id}`).evaluate(el=>el.scrollIntoView({block:'start'}));await page.screenshot({path:test.info().outputPath(`settings-${id}.png`)})
  }
  await page.locator('main').evaluate(el=>{el.scrollTop=el.scrollHeight});await page.screenshot({path:test.info().outputPath('settings-bottom.png')})
})

test('clear all device data warns about unsynced rows from another signed-out owner without exposing IDs',async({page})=>{
  const backend=await mockChecklistBackend(page);backend.fail=true;await openOwned(page);await checks(page).first().check()
  await expect.poll(async()=>(await userContents(page)).rows.length).toBe(1)
  await settings(page);await page.getByRole('button',{name:'登出',exact:true}).click()
  await expect(page.getByRole('button',{name:'登入',exact:true})).toBeVisible()
  page.once('dialog',async dialog=>{expect(dialog.message()).toContain('1 項尚未同步更改');expect(dialog.message()).not.toContain(testUser.id);await dialog.dismiss()})
  await page.getByRole('button',{name:'清除本機離線資料',exact:true}).click()
  expect((await userContents(page)).rows).toHaveLength(1)
})
