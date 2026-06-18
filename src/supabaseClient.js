import { createClient } from "@supabase/supabase-js";

// ============================================================================
// SUPABASE CONFIGURATION
// Replace the placeholder below with your actual Project anon public key from
// the Supabase Dashboard (Project Settings > API > Project API Keys > anon/public).
// The correct anon key MUST be a JSON Web Token (JWT) starting with "eyJ".
// ============================================================================

const SUPABASE_URL = "https://vrqdyyonogcuffxyhprg.supabase.co";
const SUPABASE_PUBLIC_KEY = "sb_publishable_f9cF17MjiEdNWA_bgB-oow_qNy76yv0";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY, {
  auth: {
    detectSessionInUrl: true,
    persistSession: true
  }
});
