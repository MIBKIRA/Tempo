// Supabase Edge Function: delete-account
// Deployment instructions:
//   supabase functions deploy delete-account
// Note: `--no-verify-jwt` is NOT required. Supabase platform-level JWT verification inspects the Bearer token
// on incoming calls as the first security layer. The function also performs internal secondary verification
// using `adminClient.auth.getUser(token)`.
// Ensure SUPABASE_SERVICE_ROLE_KEY and SUPABASE_URL are configured in your Supabase project secrets.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Helper to resolve origin for CORS headers
function getCorsHeaders(req: Request) {
  const requestOrigin = req.headers.get("origin") || "";
  const allowedOriginsEnv = Deno.env.get("ALLOWED_ORIGINS");
  const allowedOrigins = allowedOriginsEnv
    ? allowedOriginsEnv.split(",").map((o) => o.trim())
    : [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://tempo.it",
        "https://tempo.app",
      ];

  // Match exact allowed origin or vercel app domain pattern
  const isAllowed =
    allowedOrigins.includes(requestOrigin) ||
    /\.vercel\.app$/.test(requestOrigin) ||
    /\.run\.app$/.test(requestOrigin);

  const corsOrigin = isAllowed ? requestOrigin : (allowedOrigins[0] || "*");

  return {
    "Access-Control-Allow-Origin": corsOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "").trim();

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration missing" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Verify caller's JWT using client instance
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: { user }, error: userError } = await adminClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token or unauthorized user" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;

    // 2. Delete productivity and profile records for the user
    // Deleting blocks/tasks
    await adminClient.from("blocks").delete().eq("user_id", userId);
    
    // Deleting habit logs and habits
    await adminClient.from("habit_logs").delete().eq("user_id", userId);
    await adminClient.from("habits").delete().eq("user_id", userId);
    
    // Deleting consents
    await adminClient.from("user_consents").delete().eq("user_id", userId);
    
    // Deleting profile
    await adminClient.from("profiles").delete().eq("id", userId);

    // Delete user's avatar from 'avatars' storage bucket if exists
    let storageCleanupStatus: { attempted: boolean; success: boolean; error?: string } = {
      attempted: false,
      success: true,
    };

    try {
      storageCleanupStatus.attempted = true;
      const filePathsToRemove: string[] = [];

      // 1. List files in folder `${userId}` (matches SettingsView upload convention: `${userId}/${filename}`)
      const { data: folderFiles, error: folderErr } = await adminClient.storage
        .from("avatars")
        .list(userId);

      if (folderErr) {
        // Log generic notice if bucket doesn't exist or list fails, without sensitive user info
        storageCleanupStatus.success = false;
        storageCleanupStatus.error = "Failed to query storage avatar folder";
      } else if (folderFiles && folderFiles.length > 0) {
        folderFiles.forEach((f) => {
          if (f.name) filePathsToRemove.push(`${userId}/${f.name}`);
        });
      }

      // 2. Also check root directory for any direct file named `${userId}` or starting with `${userId}.`
      const { data: rootFiles, error: rootErr } = await adminClient.storage
        .from("avatars")
        .list("", { search: userId });

      if (!rootErr && rootFiles && rootFiles.length > 0) {
        rootFiles.forEach((f) => {
          if (f.name === userId || f.name.startsWith(`${userId}.`)) {
            if (!filePathsToRemove.includes(f.name)) {
              filePathsToRemove.push(f.name);
            }
          }
        });
      }

      if (filePathsToRemove.length > 0) {
        const { error: removeErr } = await adminClient.storage
          .from("avatars")
          .remove(filePathsToRemove);

        if (removeErr) {
          storageCleanupStatus.success = false;
          storageCleanupStatus.error = "Failed to remove avatar files from storage";
        }
      }
    } catch (_storageErr) {
      // Record failure without logging full file paths, tokens, or user data
      storageCleanupStatus.success = false;
      storageCleanupStatus.error = "Unexpected exception during storage cleanup";
    }

    // 3. Delete user from Supabase Auth admin
    const { error: deleteAuthErr } = await adminClient.auth.admin.deleteUser(userId);

    if (deleteAuthErr) {
      return new Response(
        JSON.stringify({ error: `Failed to delete auth user: ${deleteAuthErr.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Account and associated data deleted successfully.",
        storage_cleanup: storageCleanupStatus,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: message || "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
