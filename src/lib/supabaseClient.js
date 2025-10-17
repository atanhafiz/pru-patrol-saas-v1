import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Supabase env missing. Check your .env file.");
}

export const supabase = createClient(
  supabaseUrl || "https://invalid-url.supabase.co",
  supabaseAnonKey || "invalid-key"
);

// minimal debug (safe)
console.log("🔍 VITE SUPABASE URL:", import.meta.env.VITE_SUPABASE_URL);
console.log(
  "🔍 VITE SUPABASE KEY:",
  import.meta.env.VITE_SUPABASE_ANON_KEY ? "✅ detected" : "❌ missing"
);
