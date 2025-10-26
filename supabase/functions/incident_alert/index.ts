import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// ✅ Read token & chatId dari Supabase Edge Function Secrets
const BOT_TOKEN = Deno.env.get("VITE_TELEGRAM_BOT_TOKEN");
const CHAT_ID = Deno.env.get("VITE_TELEGRAM_CHAT_ID");

serve(async (req: Request) => {
  try {
    const payload = await req.json();
    const record = payload.record;

    // 🧩 Extract data
    const guardName = record.guard_name || "Guard";
    const plateNo = record.plate_no || "-";
    const description = record.message || record.description || "(No message)";
    const photoUrl =
      record.photo_url ||
      record.image_url ||
      "https://upload.wikimedia.org/wikipedia/commons/8/84/Example.svg";

    const lat = record.lat || record.latitude || null;
    const lng = record.lon || record.longitude || null;

    // 🕒 Malaysia Time
    const now = new Date();
    const malaysiaTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    const time = malaysiaTime.toLocaleString("en-MY", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    // 📍 GPS link
    const hasGPS = lat && lng && !isNaN(lat) && !isNaN(lng);
    const mapLink = hasGPS
      ? `[Open in Google Maps](https://www.google.com/maps?q=${lat},${lng})`
      : "🛰️ GPS Not Detected";

    // 📝 Build caption
    const caption = `
🚨 *INCIDENT REPORTED*
👮 ${guardName}
🏍️ ${plateNo}
🕓 ${time}
📍 ${mapLink}
📝 ${description}
`;

    // 🛰️ Send to Telegram
    const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`;
    const res = await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        photo: photoUrl,
        caption,
        parse_mode: "Markdown",
      }),
    });

    if (!res.ok) {
      const errMsg = await res.text();
      console.error("❌ Telegram response:", errMsg);
      return new Response("Telegram send failed", { status: 500 });
    }

    console.log("✅ Incident alert sent to Telegram group");
    return new Response("✅ Telegram alert sent successfully", { status: 200 });
  } catch (err) {
    console.error("❌ Incident alert failed:", err);
    return new Response("Error sending Telegram alert", { status: 500 });
  }
});
