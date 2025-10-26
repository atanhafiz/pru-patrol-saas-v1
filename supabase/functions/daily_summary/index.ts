import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 🧠 Environment vars (auto from Supabase Secrets)
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const BOT_TOKEN = Deno.env.get("VITE_TELEGRAM_BOT_TOKEN");
const CHAT_ID = Deno.env.get("VITE_TELEGRAM_CHAT_ID");

// 🧩 Setup Supabase client
const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

serve(async () => {
  try {
    // 📅 Range hari ni
    const today = new Date();
    const start = new Date(today);
    start.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);

    // 🧾 Ambil data attendance
    const { count: attendanceCount } = await supabase
      .from("attendance_log")
      .select("*", { count: "exact", head: true })
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString());

    // 🚨 Ambil data incident
    const { count: incidentCount } = await supabase
      .from("incidents")
      .select("*", { count: "exact", head: true })
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString());

    // 👮 Dapatkan nama guard aktif
    const { data: activeGuards } = await supabase
      .from("attendance_log")
      .select("guard_name")
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString());

    const uniqueGuards = [
      ...new Set((activeGuards || []).map((g) => g.guard_name).filter(Boolean)),
    ];

    // 🇲🇾 Masa Malaysia
    const now = new Date();
    const malaysia = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    const dateStr = malaysia.toLocaleDateString("en-MY", {
      weekday: "long",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    // 📝 Bina mesej
    const caption = `
🧾 *Daily Patrol Summary – Prima Residensi Utama®️*
──────────────────────
📅 ${dateStr}
👮 Active Guards: ${uniqueGuards.join(", ") || "-"}
✅ Attendance Today: ${attendanceCount || 0}
🚨 Incidents Reported: ${incidentCount || 0}

⚙️ _Powered by AHE Technology Sdn Bhd_
`;

    // 💬 Hantar ke Telegram
    const res = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: caption,
          parse_mode: "Markdown",
        }),
      }
    );

    if (!res.ok) throw new Error(await res.text());
    console.log("✅ Daily summary sent!");
    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("❌ Daily summary failed:", err.message);
    return new Response("Error", { status: 500 });
  }
});
