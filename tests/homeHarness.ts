import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { build } from 'vite'
import type { Page } from '@playwright/test'
import type { TripSnapshot } from '../src/data/schema/trip'

// Isolated browser component fixture; never included in the application build.
let bundle: Promise<{ js: string; css: string }> | undefined
function componentBundle() {
  return bundle ??= (async () => {
    mkdirSync('work', { recursive: true })
    const dir = mkdtempSync(resolve('work/home-component-'))
    const entry = join(dir, 'entry.mjs')
    writeFileSync(entry, `
      import { createElement as h } from 'react';
      import { createRoot } from 'react-dom/client';
      import { MemoryRouter } from 'react-router-dom';
      import { TripCard } from ${JSON.stringify(resolve('src/components/TripCard.tsx'))};
      import ${JSON.stringify(resolve('src/styles/global.css'))};
      import ${JSON.stringify(resolve('src/styles/home.css'))};
      window.openedSlugs = [];
      createRoot(document.getElementById('fixture')).render(h(MemoryRouter, null,
        h('div', { className: 'home-page' }, h('div', { className: 'trip-list' },
          window.snapshots.map(snapshot => h(TripCard, { key: snapshot.trip.slug,
            snapshot, status: 'upcoming', demo: true,
            onOpen: slug => window.openedSlugs.push(slug) }))))));
    `)
    const result = await build({ configFile: false, base: '/travelpilot-poc/', logLevel: 'silent',
      define: { 'process.env.NODE_ENV': JSON.stringify('production') },
      build: { write: false, lib: { entry, formats: ['iife'], name: 'TripCardFixture' } } })
    const built = Array.isArray(result) ? result[0] : result
    if (!('output' in built)) throw new Error('Expected an in-memory component bundle')
    const output = built.output
    return {
      js: output.filter((item) => item.type === 'chunk').map((item) => item.code).join('\n'),
      css: output.flatMap((item) => item.type === 'asset' && item.fileName.endsWith('.css') ? [String(item.source)] : []).join('\n'),
    }
  })()
}
export async function renderCards(page: Page, snapshots: TripSnapshot[]) {
  const { js, css } = await componentBundle()
  await page.route('**/home-component-fixture', (route) => route.fulfill({ contentType: 'text/html; charset=utf-8', body:
    `<html lang="zh-HK"><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>${css}</style><div id="fixture"></div><script>window.snapshots=${JSON.stringify(snapshots).replace(/</g, '\\u003c')};</script><script>${js.replace(/<\/script/gi, '<\\/script')}</script></html>` }))
  await page.goto('http://127.0.0.1:4173/travelpilot-poc/home-component-fixture')
}
