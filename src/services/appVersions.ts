import { z } from 'zod'
import { supabase } from './supabase'
import { resolveAppUpdate } from '../data/appVersions'
import type { UpdateResult } from '../data/appVersions'
export async function checkAppUpdate(current: string, signal: AbortSignal): Promise<UpdateResult> {
  try {
    const { data, error } = await supabase.from('v2_app_versions').select('app_version,published,released_at')
      .eq('published', true).retry(false).abortSignal(signal)
    const rows = z.array(z.object({ app_version: z.string(), published: z.literal(true), released_at: z.string() })).safeParse(data)
    return error || !rows.success ? { state: 'unavailable' } : resolveAppUpdate(current, rows.data.map((row) => row.app_version))
  } catch { return { state: 'unavailable' } }
}
