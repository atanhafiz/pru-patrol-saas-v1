import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: Request) => {
  try {
    const payload = await req.json();

    // data from Supabase insert event
    const record = payload.record;
    const guard_name = record.guard_name || "Unknown Guard";
    const plate_no = record.plate_no || "-";
    const message = record.message || "(No message)";
    const photo_url = record.photo_url || "https://upload.wikimedia.org/wikipedia/commons/8/84/Example.svg";

    const botToken = "8441973521:AAGfPTUthK-ecZeuN4-qTIqIO0131pnRWJE";
    const chatId = "392785272";

    const caption =
      `🚨 *New Incident Report*\n` +
      `👤 Guard: ${guard_name}\n` +
      `🏍️ Plate: ${plate_no}\n` +
      `🕓 ${new Date().toLocaleString()}\n` +
      `📝 Message: ${message}`;

    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendPhoto`;

    await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        photo: photo_url,
        caption,
        parse_mode: "Markdown",
      }),
    });

    return new Response("✅ Telegram alert sent successfully", { status: 200 });
  } catch (err) {
    console.error("❌ Incident alert failed:", err);
    return new Response("Error sending Telegram alert", { status: 500 });
  }
});
