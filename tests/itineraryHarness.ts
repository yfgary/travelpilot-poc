import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { build } from 'vite'
import type { Page } from '@playwright/test'
import type { TripSnapshot } from '../src/data/schema/trip'

let bundle: Promise<{ js: string; css: string }> | undefined
function galleryBundle() {
  return bundle ??= (async () => {
    mkdirSync('work', { recursive: true })
    const entry = join(mkdtempSync(resolve('work/gallery-component-')), 'entry.mjs')
    writeFileSync(entry, `import {createElement as h} from 'react'; import {createRoot} from 'react-dom/client';
      import {DayGallery} from ${JSON.stringify(resolve('src/components/itinerary/DayGallery.tsx'))};
      import ${JSON.stringify(resolve('src/styles/global.css'))}; import ${JSON.stringify(resolve('src/styles/itinerary.css'))};
      createRoot(document.getElementById('fixture')).render(h(DayGallery, window.galleryProps));`)
    const result = await build({ configFile: false, base: '/travelpilot-poc/', logLevel: 'silent',
      define: { 'process.env.NODE_ENV': JSON.stringify('production') },
      build: { write: false, lib: { entry, formats: ['iife'], name: 'GalleryFixture' } } })
    const built = Array.isArray(result) ? result[0] : result
    if (!('output' in built)) throw new Error('Expected component bundle')
    return { js: built.output.flatMap((item) => item.type === 'chunk' ? [item.code] : []).join('\n'),
      css: built.output.flatMap((item) => item.type === 'asset' && item.fileName.endsWith('.css') ? [String(item.source)] : []).join('\n') }
  })()
}
export async function renderGallery(page: Page, props: { imageIds: string[]; images: TripSnapshot['images'] }) {
  const { js, css } = await galleryBundle()
  await page.route('**/gallery-component-fixture', (route) => route.fulfill({ contentType: 'text/html; charset=utf-8', body:
    `<html lang="zh-HK"><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>${css}</style><div id="fixture"></div><script>window.galleryProps=${JSON.stringify(props).replace(/</g, '\\u003c')};</script><script>${js.replace(/<\/script/gi, '<\\/script')}</script></html>` }))
  await page.goto('http://127.0.0.1:4173/travelpilot-poc/gallery-component-fixture')
}
