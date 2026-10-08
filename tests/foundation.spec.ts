import { readFileSync } from 'node:fs'
import { test, expect } from './fixtures'
import packageMetadata from '../package.json' with { type: 'json' }

const tripPages = [
  ['itinerary', '詳細行程'],
  ['info', '旅程資料'],
  ['attractions', '景點總覽'],
  ['live', 'Live Cam'],
  ['today', '今日模式'],
]
const pages = [
  ['#/', '每一段旅程，都準備妥當。'],
  ['#/settings', '設定'],
  ...tripPages.map(([path, title]) => [`#/trip/demo-trip/${path}`, title]),
]

for (const [route, title] of pages) {
  test(`${route} loads and reloads in the shared shell`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(route)
    await expect(page.getByRole('heading', { level: 1, name: title, exact: true })).toBeVisible()
    if (route.includes('/trip/')) {
      await expect(page.locator('code')).toHaveText('demo-trip')
      await expect(page.locator('.panel')).toContainText('demo-trip')
      await expect(page.getByRole('navigation', { name: '旅程頁面' }).getByRole('link')).toHaveCount(5)
    }
    await page.reload()
    await expect(page.getByRole('heading', { level: 1, name: title, exact: true })).toBeVisible()
    await expect(page.getByRole('navigation', { name: '主導覽' })).toBeVisible()
    const status = page.getByRole('status')
    await expect(status).toContainText('ONLINE')
    await expect(status).toContainText(`App Version v${packageMetadata.version}`)
    const box = await status.boundingBox()
    const viewport = page.viewportSize()!
    expect(box!.x).toBeLessThan(20)
    expect(box!.y + box!.height).toBeGreaterThan(viewport.height - 20)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    expect(errors).toEqual([])
  })
}

for (const [path] of tripPages) {
  test(`unknown trip on ${path} shows a generic state`, async ({ page }) => {
    await page.goto(`#/trip/missing-trip/${path}`)
    await expect(page.getByRole('heading', { name: '找不到旅程' })).toBeVisible()
    await expect(page.getByRole('status')).toBeVisible()
    await page.getByRole('link', { name: '返回首頁' }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('每一段旅程，都準備妥當。')
  })
}

test('navigation and connection status remain shared across routes', async ({ page, context }) => {
  await page.goto('#/')
  await page.getByRole('article').filter({ hasText: '城市週末示範旅程' }).getByRole('link', { name: '詳細行程', exact: true }).click()
  for (const [, title] of tripPages) {
    await page.getByRole('navigation', { name: '旅程頁面' }).getByRole('link', { name: title, exact: true }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title)
  }
  await context.setOffline(true)
  await expect(page.getByRole('status')).toContainText('OFFLINE')
  await page.getByRole('navigation', { name: '主導覽' }).getByRole('link', { name: '設定' }).click()
  await expect(page.getByRole('heading', { name: '設定', exact: true })).toBeVisible()
  await expect(page.getByRole('status')).toContainText('OFFLINE')
  await context.setOffline(false)
  await expect(page.getByRole('status')).toContainText('ONLINE')
})

test('manifest and branding resolve under the GitHub Pages repository base', async ({ page, request }) => {
  await page.goto('#/')
  for (const image of await page.locator('img').all()) {
    expect(await image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true)
  }
  const manifestURL = await page.locator('link[rel="manifest"]').evaluate((element: HTMLLinkElement) => element.href)
  const response = await request.get(manifestURL)
  expect(response.ok()).toBe(true)
  const manifest = await response.json()
  expect(manifest).toMatchObject({ name: 'TravelPilot｜旅程管家', short_name: 'TravelPilot', lang: 'zh-HK', display: 'standalone' })
  expect(new URL(manifest.start_url, manifestURL).pathname).toBe('/travelpilot-poc/')
  expect(new URL(manifest.start_url, manifestURL).hash).toBe('#/')
  expect(new URL(manifest.scope, manifestURL).pathname).toBe('/travelpilot-poc/')
  for (const filename of ['travelpilot_icon.PNG', 'travelpilot_banner.PNG']) {
    const asset = await request.get(`assets/images/${filename}`)
    expect(asset.ok()).toBe(true)
    expect(await asset.body()).toEqual(readFileSync(`assets/images/${filename}`))
  }
  expect(new URL(manifest.icons[0].src, manifestURL).pathname).toBe('/travelpilot-poc/assets/images/travelpilot_icon.PNG')
})

test('unmatched page retains the shell and offers home navigation', async ({ page }) => {
  await page.goto('#/unknown-page')
  await expect(page.getByRole('heading', { name: '找不到頁面' })).toBeVisible()
  await expect(page.getByRole('status')).toBeVisible()
})

test('approved labels and release version are shown', async ({ page }) => {
  expect(packageMetadata.version).toBe('2.0.0-poc.9')
  await page.goto('#/trip/demo-trip/itinerary')
  await expect(page.getByRole('navigation', { name: '主導覽' }).getByRole('link')).toHaveText(['首頁', '設定'])
  await expect(page.getByRole('navigation', { name: '旅程頁面' }).getByRole('link')).toHaveText(tripPages.map(([, title]) => title))
  await expect(page.getByRole('status')).toContainText('App Version v2.0.0-poc.9')
  await expect(page.getByText('旅程資訊', { exact: true })).toHaveCount(0)
  await expect(page.getByText('即時影像', { exact: true })).toHaveCount(0)
})

test('all font sizes scale the global UI, persist and fit every route', async ({ page }) => {
  const samples: number[][] = []
  for (const [label, size] of [['小', 'small'], ['中', 'medium'], ['大', 'large']]) {
    await page.goto('#/settings')
    await page.getByRole('radio', { name: label, exact: true }).check()
    await expect(page.getByRole('radio', { name: label, exact: true })).toBeChecked()
    await expect(page.locator('html')).toHaveAttribute('data-font-size', size)
    await page.reload()
    await expect(page.getByRole('radio', { name: label, exact: true })).toBeChecked()
    samples.push(await page.evaluate(() => [
      document.body, document.querySelector('h1')!, document.querySelector('.brand')!,
      document.querySelector('.app-status')!,
    ].map((element) => parseFloat(getComputedStyle(element).fontSize))))
    for (const [route] of pages) {
      await page.goto(route)
      await expect(page.locator('html')).toHaveAttribute('data-font-size', size)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      expect(await page.locator('main').evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
      const contentBox = (await page.locator('main').boundingBox())!
      expect(contentBox.y + contentBox.height).toBeLessThanOrEqual((await page.locator('.status-dock').boundingBox())!.y)
      for (const link of await page.locator('nav a').all()) {
        const box = (await link.boundingBox())!
        expect(box.height).toBeGreaterThanOrEqual(44)
        expect(box.width).toBeGreaterThanOrEqual(44)
        expect(box.x).toBeGreaterThanOrEqual(0)
        expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize()!.width)
      }
      // At the end of scrolling, every actionable control can clear the status dock.
      await page.locator('main').evaluate((element) => { element.scrollTop = element.scrollHeight })
      const dockTop = (await page.locator('.status-dock').boundingBox())!.y
      for (const control of await page.locator('main a, main label').all()) {
        const box = (await control.boundingBox())!
        if (box.y >= 0) expect(box.y + box.height).toBeLessThanOrEqual(dockTop)
      }
      await expect(page.getByRole('status')).toBeVisible()
    }
  }
  for (let index = 0; index < samples[0].length; index++) {
    expect(samples[0][index]).toBeLessThan(samples[1][index])
    expect(samples[1][index]).toBeLessThan(samples[2][index])
  }
})

test('invalid saved font value falls back to medium', async ({ page }) => {
  await page.goto('#/settings')
  await page.evaluate(() => localStorage.setItem('travelpilot.font-size', 'invalid'))
  await page.reload()
  await expect(page.getByRole('radio', { name: '中', exact: true })).toBeChecked()
})

test('blocked preference storage keeps font controls usable', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new Error('Storage unavailable') }
    Storage.prototype.setItem = () => { throw new Error('Storage unavailable') }
  })
  await page.goto('#/settings')
  await page.getByRole('radio', { name: '大', exact: true }).check()
  await expect(page.locator('html')).toHaveAttribute('data-font-size', 'large')
  await expect(page.getByRole('alert')).toContainText('字體設定只適用於本次使用')
})

test('home banner preserves its aspect ratio and cards stay readable', async ({ page }) => {
  await page.goto('#/')
  const box = (await page.locator('.home-banner').boundingBox())!
  expect(box.width / box.height).toBeCloseTo(1672 / 941, 2)
  await expect(page.getByText('行程、景點、天氣與旅途資訊，一站管理。', { exact: true })).toBeVisible()
  await expect(page.getByRole('article')).toHaveCount(2)
  await page.screenshot({ path: test.info().outputPath('home.png'), fullPage: true })
  await page.goto('#/settings')
  await page.getByRole('radio', { name: '大', exact: true }).check()
  await page.screenshot({ path: test.info().outputPath('settings-large.png'), fullPage: true })
})

test('canonical source images still match the Step 3 originals', async () => {
  const { createHash } = await import('node:crypto')
  const originals = {
    'travelpilot_banner.PNG': 'f9e41195b72afb12415ac055cf7a73327ad50b984df21e07f70990d315bbc513',
    'travelpilot_icon.PNG': 'ddab7c01b69509f742a557ab01a85e9f9c37f5995fcdc6131a85114be9f1d6e7',
  }
  for (const [filename, checksum] of Object.entries(originals)) {
    expect(createHash('sha256').update(readFileSync(`assets/images/${filename}`)).digest('hex')).toBe(checksum)
  }
})
