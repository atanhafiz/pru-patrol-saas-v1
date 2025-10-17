import { createClient } from "@supabase/supabase-js";

// Debug logs before client init
console.log("🔍 URL:", import.meta.env.VITE_SUPABASE_URL);
console.log("🔍 KEY:", import.meta.env.VITE_SUPABASE_KEY ? "✅ detected" : "❌ missing");

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Supabase env missing. Check your .env file.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
