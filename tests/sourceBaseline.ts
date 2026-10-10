import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { expect } from '@playwright/test'

// Source-controlled byte fingerprints work in shallow CI checkouts and protect
// committed files too. Update a round's baseline only with scope authorization.
export function assertSourceBaseline(roots: string[], baseline: Record<string, string>) {
  // Git's file inventory requires no ancestor objects and excludes ignored
  // build/CLI caches, while including new nonignored source files.
  const inventory = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '--', ...roots], { encoding: 'utf8' })
  const paths = [...new Set(inventory.split('\n').filter(Boolean))].sort()
  const expected = Object.fromEntries(Object.entries(baseline).filter(([path]) => roots.some((root) => path === root || path.startsWith(`${root}/`))))
  expect(Object.keys(expected).length).toBeGreaterThan(0)
  const actual = Object.fromEntries(paths.map((path) => [path, createHash('sha256').update(readFileSync(path)).digest('hex')]))
  expect(actual).toEqual(expected)
}
