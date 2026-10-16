import { cpSync, existsSync, readFileSync, readdirSync, lstatSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../', import.meta.url))
const normal = resolve(root, 'dist'), isolated = resolve(root, 'dist-preview'), review = join(normal, 'review')
const digest = bytes => createHash('sha256').update(bytes).digest('hex')
const read = path => readFileSync(path, 'utf8')
function inventory(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name)
    if (lstatSync(path).isSymbolicLink()) throw new Error('Symlinks are not permitted in Pages artifact')
    return entry.isDirectory() ? inventory(path) : [path]
  })
}
const descriptor = JSON.parse(read(join(root, 'preview/inputs.json')))
if (digest(readFileSync(join(root, descriptor.file))) !== descriptor.sha256) throw new Error('Review draft checksum mismatch')
if (process.argv[2] !== '--verify') {
  if (existsSync(review)) throw new Error('Build normal output first; refusing to overwrite an existing review tree')
  const before = new Map(inventory(normal).map(path => [path, digest(readFileSync(path))]))
  cpSync(isolated, review, { recursive: true, errorOnExist: true, force: false })
  for (const [path, hash] of before) if (digest(readFileSync(path)) !== hash) throw new Error('Normal output changed while packaging')
}
for (const [dir, base] of [[normal, '/travelpilot-poc/'], [review, '/travelpilot-poc/review/']]) {
  const html = read(join(dir, 'index.html'))
  for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    const url = match[1]
    if (!url.startsWith(base) || !existsSync(join(dir, url.slice(base.length)))) throw new Error('Wrong Pages entry asset base/path')
  }
  const manifest = JSON.parse(read(join(dir, 'manifest.webmanifest')))
  if (manifest.id !== './' || manifest.scope !== './' || manifest.start_url !== './#/') throw new Error('Manifest must resolve within its own app directory')
  for (const icon of manifest.icons) if (!existsSync(join(dir, icon.src))) throw new Error('Missing app icon')
  for (const asset of inventory(join(root, 'assets'))) {
    const relative = asset.slice(root.length)
    if (!existsSync(join(dir, relative)) || digest(readFileSync(asset)) !== digest(readFileSync(join(dir, relative)))) throw new Error('Protected asset missing or changed')
  }
}
const normalText = inventory(normal).filter(path => !path.startsWith(`${review}/`) && /\.(js|html|css|json)$/.test(path)).map(read).join('\n')
for (const marker of [descriptor.dataVersion, descriptor.sha256, 'isolated-preview-fixed-sample-v1', 'travelpilot-preview-v2-user-state']) if (normalText.includes(marker)) throw new Error('Review data/runtime leaked into normal app')
const reviewText = inventory(review).filter(path => /\.js$/.test(path)).map(read).join('\n')
for (const marker of ['sb_publishable_', 'supabase.co', 'api.open-meteo.com', '/auth/v1/', '/rest/v1/']) if (reviewText.includes(marker)) throw new Error('Live transport retained in review')
for (const path of inventory(isolated)) {
  const target = join(review, path.slice(isolated.length + 1))
  if (!existsSync(target) || digest(readFileSync(path)) !== digest(readFileSync(target))) throw new Error('Incomplete or stale review package')
}
console.log('Pages artifact verified: normal root + review root; scoped assets/manifest, validated draft and no live review transports')
