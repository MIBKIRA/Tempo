import { createClient } from "@supabase/supabase-js";

// ============================================================================
// SUPABASE CONFIGURATION
// Replace the placeholder below with your actual Project anon public key from
// the Supabase Dashboard (Project Settings > API > Project API Keys > anon/public).
// The correct anon key MUST be a JSON Web Token (JWT) starting with "eyJ".
// ============================================================================

const SUPABASE_URL = "https://vrqdyyonogcuffxyhprg.supabase.co";
const SUPABASE_PUBLIC_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZycWR5eW9ub2djdWZmeHlocHJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2MTM3NDgsImV4cCI6MjA5NjE4OTc0OH0.oqpAeLHxryH96SWmFITxaeDttfHeMYzqI1VZ_J1LF_k";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
