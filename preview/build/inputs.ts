import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve, relative } from 'node:path'
import descriptor from '../inputs.json' with { type: 'json' }
import { validatePreviewInput } from '../validation'
export function readPreviewInput(root: string) {
  const within = (file: string) => {
    const path = resolve(root, file)
    if (relative(root, path).startsWith('..')) throw new Error('Preview path outside repository')
    return path
  }
  const bytes = readFileSync(within(descriptor.file))
  const input = { ...descriptor, raw: bytes.toString('utf8') }
  const snapshot = validatePreviewInput(input, createHash('sha256').update(bytes).digest('hex'))
  const manifest = JSON.parse(readFileSync(within(descriptor.manifest), 'utf8'))
  if (manifest.draftSha256 !== input.sha256 || manifest.draftSchemaVersion !== snapshot.schemaVersion || manifest.proposedDataVersion !== input.dataVersion || manifest.published !== false || manifest.isCurrent !== false || manifest.authorizedForSupabaseWrite !== false) throw new Error('Preview manifest mismatch')
  return input
}
