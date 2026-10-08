import { z } from 'zod'
import { supabase } from './supabase'
import { ownerScope } from '../data/checklistState'
import type { ChecklistState } from '../data/checklistState'

const row = z.object({ user_id: z.uuid(), trip_id: z.uuid(), checklist_item_id: z.string().min(1), checked: z.boolean(),
  client_updated_at: z.iso.datetime({ offset: true }), device_id: z.string().nullable(), updated_at: z.iso.datetime({ offset: true }) })
export async function pullChecklist(ownerId: string, tripId: string, definedItemIds: Set<string>, signal: AbortSignal): Promise<ChecklistState[]> {
  const ids = [...definedItemIds], records: z.infer<typeof row>[] = []
  // Bounded ID batches avoid the server row limit and irrelevant orphan rows.
  // Owner/trip filters apply independently to every read.
  for (let offset = 0; offset < ids.length; offset += 200) {
    const { data, error } = await supabase.from('v2_checklist_state')
      .select('user_id,trip_id,checklist_item_id,checked,client_updated_at,device_id,updated_at')
      .eq('user_id', ownerId).eq('trip_id', tripId).in('checklist_item_id', ids.slice(offset, offset + 200))
      .retry(false).abortSignal(signal)
    if (error) throw new Error('Checklist unavailable')
    const parsed = z.array(row).safeParse(data)
    if (!parsed.success || parsed.data.some((record) => record.user_id !== ownerId || record.trip_id !== tripId)) throw new Error('Invalid checklist response')
    records.push(...parsed.data)
  }
  return records.filter((record) => definedItemIds.has(record.checklist_item_id)).map((record) => ({
    scope: ownerScope(ownerId), ownerId, tripId, checklistItemId: record.checklist_item_id, checked: record.checked,
    clientUpdatedAt: record.client_updated_at, deviceId: record.device_id ?? '', serverUpdatedAt: record.updated_at, dirty: false,
  }))
}
export async function pushChecklist(ownerId: string, tripId: string, records: ChecklistState[], signal: AbortSignal) {
  if (records.some((record) => record.ownerId !== ownerId || record.tripId !== tripId)) throw new Error('Invalid owner context')
  if (!records.length) return
  const { error } = await supabase.from('v2_checklist_state').upsert(records.map((record) => ({
    user_id: ownerId, trip_id: tripId, checklist_item_id: record.checklistItemId, checked: record.checked,
    client_updated_at: record.clientUpdatedAt, device_id: record.deviceId,
  })), { onConflict: 'user_id,trip_id,checklist_item_id', ignoreDuplicates: false }).retry(false).abortSignal(signal)
  if (error) throw new Error('Checklist unavailable')
}
