import { supabase } from './supabase'

export async function checkBackend(signal: AbortSignal): Promise<boolean> {
  const { error } = await supabase.from('v2_app_versions')
    .select('app_version').eq('published', true).limit(1).retry(false).abortSignal(signal)
  // An empty published list is a successful read, not a connectivity failure.
  return !error
}
