// Supabase Edge Function: delete-account
// Deployment instructions:
//   supabase functions deploy delete-account --no-verify-jwt
// Ensure SUPABASE_SERVICE_ROLE_KEY and SUPABASE_URL are configured in your Supabase project secrets.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
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
    try {
      const { data: files } = await adminClient.storage.from("avatars").list(userId);
      if (files && files.length > 0) {
        const filePaths = files.map((f) => `${userId}/${f.name}`);
        await adminClient.storage.from("avatars").remove(filePaths);
      }
    } catch (storageErr) {
      // Storage bucket cleanup error logged silently or ignored if no avatar
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
      JSON.stringify({ success: true, message: "Account and associated data deleted successfully." }),
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
