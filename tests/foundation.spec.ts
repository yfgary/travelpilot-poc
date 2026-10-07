import { readFileSync } from 'node:fs'
import { test, expect } from '@playwright/test'
import packageMetadata from '../package.json' with { type: 'json' }

const tripPages = [
  ['itinerary', '詳細行程'],
  ['info', '旅程資訊'],
  ['attractions', '景點總覽'],
  ['live', '即時影像'],
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
  await page.getByRole('link', { name: '開啟旅程' }).click()
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
