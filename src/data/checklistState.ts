export type ChecklistState = {
  scope: string; ownerId: string | null; tripId: string; checklistItemId: string
  checked: boolean; clientUpdatedAt: string; deviceId: string; dirty: boolean; serverUpdatedAt?: string
}
export type ChangeTuple = Pick<ChecklistState, 'clientUpdatedAt' | 'deviceId'>
export const ownerScope = (ownerId: string | null) => ownerId ?? 'local-demo'
export const stateKey = (ownerId: string | null, tripId: string, itemId: string) => JSON.stringify([ownerScope(ownerId), tripId, itemId])
export function nextMutationTime(now: number, last: number) { return Math.max(now, last + 1) }
function micros(value: string) {
  const fraction = value.match(/\.(\d+)/)?.[1] ?? ''
  return BigInt(Date.parse(value)) * 1000n + BigInt(fraction.padEnd(6, '0').slice(3, 6))
}
// Match Postgres timestamptz precision and C/UTF-8 device-ID ordering.
export function compareChanges(a: ChangeTuple, b: ChangeTuple): number {
  const first = micros(a.clientUpdatedAt), second = micros(b.clientUpdatedAt)
  if (first !== second) return first > second ? 1 : -1
  const encoder = new TextEncoder(), left = encoder.encode(a.deviceId), right = encoder.encode(b.deviceId)
  for (let i = 0; i < Math.min(left.length, right.length); i++) if (left[i] !== right[i]) return left[i] > right[i] ? 1 : -1
  return Math.sign(left.length - right.length)
}
