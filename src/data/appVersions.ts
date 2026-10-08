type Version = { parts: number[]; prerelease: string[] }
function parse(value: string): Version | undefined {
  const match = /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([A-Za-z0-9.-]+))?(?:\+[A-Za-z0-9.-]+)?$/.exec(value)
  if (!match) return undefined
  const prerelease = match[4]?.split('.') ?? []
  if (prerelease.some((part) => !part || (/^\d+$/.test(part) && part.length > 1 && part.startsWith('0')))) return undefined
  return { parts: match.slice(1, 4).map(Number), prerelease }
}
export function compareAppVersions(first: string, second: string): number | undefined {
  const a = parse(first), b = parse(second)
  if (!a || !b) return undefined
  for (let i = 0; i < 3; i++) if (a.parts[i] !== b.parts[i]) return Math.sign(a.parts[i] - b.parts[i])
  if (!a.prerelease.length || !b.prerelease.length) return Math.sign(b.prerelease.length - a.prerelease.length)
  for (let i = 0; i < Math.max(a.prerelease.length, b.prerelease.length); i++) {
    const left = a.prerelease[i], right = b.prerelease[i]
    if (left === undefined || right === undefined) return left === undefined ? -1 : 1
    if (left === right) continue
    const numericLeft = /^\d+$/.test(left), numericRight = /^\d+$/.test(right)
    if (numericLeft && numericRight) return BigInt(left) > BigInt(right) ? 1 : -1
    if (numericLeft !== numericRight) return numericLeft ? -1 : 1
    return left > right ? 1 : -1
  }
  return 0
}
export type UpdateResult = { state: 'latest' | 'unsynced' | 'unavailable' } | { state: 'available'; version: string }
export function resolveAppUpdate(current: string, versions: string[]): UpdateResult {
  if (!versions.some((version) => compareAppVersions(version, current) === 0)) return { state: 'unsynced' }
  const newer = versions.filter((version) => compareAppVersions(version, current) === 1).sort((a, b) => compareAppVersions(b, a) ?? 0)
  return newer.length ? { state: 'available', version: newer[0] } : { state: 'latest' }
}
