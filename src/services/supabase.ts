import { createClient } from '@supabase/supabase-js'
import { supabaseConfig } from './supabaseConfig'

// One browser client; supabase-js owns session persistence and token refresh.
// Password-only auth does not consume URL fragments used by our HashRouter.
export const supabase = createClient(supabaseConfig.url, supabaseConfig.publishableKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
})
