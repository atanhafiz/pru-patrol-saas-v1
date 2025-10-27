/**
 * 🏢 Intro message – Auto send to group once per session (no duplicate)
 */
let telegramIntroSent = false; // ✅ Global flag (persist selama page belum reload)

export async function sendTelegramIntro() {
  try {
    // 🧩 Elak hantar berulang
    if (telegramIntroSent || sessionStorage.getItem("sentTelegramWelcome")) {
      console.log("⏭️ Intro message already sent this session.");
      return;
    }

    telegramIntroSent = true; // set sebelum fetch (supaya race condition tak jadi)

    const message = `
🏢 *AHE SmartPatrol – Prima Residensi Utama®️*  
──────────────────────  
Welcome to the official *AHE SmartPatrol* group for Prima Residensi Utama®️.  
All patrol updates, incidents, and guard activities will appear here in real-time.  

*Photo & Location Updates:*  
Guards will post route photos, patrol start/stop, and incident reports automatically.  

*System Active:* Real-time monitoring is now online.  
──────────────────────  
_Powered by AHE Technology Sdn Bhd_
    `;

    const res = await fetch(`${BASE_URL}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: "Markdown",
      }),
    });

    if (!res.ok) throw new Error(`Intro message failed (${res.status})`);
    console.log("✅ Intro message sent to Telegram group");

    sessionStorage.setItem("sentTelegramWelcome", "true");
  } catch (err) {
    console.error("❌ Telegram intro error:", err.message);
    telegramIntroSent = false; // reset kalau error (boleh cuba balik)
  }
}
/**
 * 💬 General message sender – reusable for all notifications
 */
const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
const CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID;
const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

export async function sendTelegramMessage(text) {
  try {
    const res = await fetch(`${BASE_URL}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
        parse_mode: "Markdown",
      }),
    });

    if (!res.ok) throw new Error(`Send message failed (${res.status})`);
    console.log("✅ Telegram message sent:", text.slice(0, 40));
  } catch (err) {
    console.error("❌ Telegram send error:", err.message);
  }
}
