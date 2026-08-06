import { createClient } from "@supabase/supabase-js";

// ============================================================================
// SUPABASE CONFIGURATION
// Replace the placeholder below with your actual Supabase publishable
// key from the Supabase Dashboard (Project Settings > API Keys).
// The current key format is sb_publishable_..., not a legacy JWT anon key.
// ============================================================================

const SUPABASE_URL = "https://vrqdyyonogcuffxyhprg.supabase.co";
const SUPABASE_PUBLIC_KEY = "sb_publishable_f9cF17MjiEdNWA_bgB-oow_qNy76yv0";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY, {
  auth: {
    detectSessionInUrl: true,
    persistSession: true
  }
});
