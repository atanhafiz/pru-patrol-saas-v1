import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { error } = await supabase
    .from("guard_tracks")
    .delete()
    .lt("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  if (error) {
    console.error("❌ Error deleting old tracks:", error.message);
    return new Response("Failed to delete old tracks", { status: 500 });
  }

  console.log("✅ Old guard_tracks cleaned successfully");
  return new Response("Old guard_tracks cleaned", { status: 200 });
});
