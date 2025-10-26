// ✅ AHE SmartPatrol – Telegram API helper
// Unified helper to send both photo and text messages via Telegram Bot API.

const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
const CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID;
const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

/**
 * 🧠 Format caption ikut jenis mesej:
 * type = selfieIn | selfieOut | houseSnap | incident
 */
export function buildCaption(type, data = {}) {
  const { guardName, plateNo, lat, lng, house, street, block, title, description } = data;

  // 🇲🇾 Timezone Malaysia (UTC+8)
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

  // GPS check
  const hasGPS = lat && lng && !isNaN(lat) && !isNaN(lng);
  const locationText = hasGPS
    ? `[Open in Google Maps](https://www.google.com/maps?q=${lat},${lng})`
    : "🛰️ GPS Not Detected";

  switch (type) {
    case "selfieIn":
      return `🚨 *Guard START PATROL*\n👮 ${guardName}\n🏍️ ${plateNo}\n📍 ${locationText}\n🕒 ${time}`;
    case "selfieOut":
      return `✅ *Guard END PATROL*\n👮 ${guardName}\n🏍️ ${plateNo}\n📍 ${locationText}\n🕒 ${time}`;
    case "houseSnap":
      return `🏠 *Patrol Checkpoint*\n📍 ${house} ${street} (${block})\n👮 ${guardName}\n🏍️ ${plateNo}\n📌 ${locationText}\n🕓 ${time}`;
    case "incident":
      return `🚨 *INCIDENT REPORTED*\n📝 ${description || "No description"}\n👮 Reported By: ${guardName}\n📍 ${locationText}\n🕒 ${time}`;
    default:
      return `📝 ${description || "No details"}\n🕒 ${time}`;
  }
}

/**
 * 📸 Send Photo to Telegram
 */
export async function sendTelegramPhoto(photoUrl, caption) {
  try {
    const res = await fetch(`${BASE_URL}/sendPhoto`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        photo: photoUrl,
        caption,
        parse_mode: "Markdown",
      }),
    });
    if (!res.ok) throw new Error(`sendPhoto failed (${res.status})`);
    console.log("✅ Telegram photo sent");
  } catch (err) {
    console.error("❌ Telegram photo error:", err.message);
  }
}

/**
 * 💬 Send Text-only message
 */
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
    if (!res.ok) throw new Error(`sendMessage failed (${res.status})`);
    console.log("✅ Telegram text sent");
  } catch (err) {
    console.error("❌ Telegram message error:", err.message);
  }
}

/**
 * 🏢 Intro message – Auto send to group when system starts
 */
export async function sendTelegramIntro() {
  try {
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
  } catch (err) {
    console.error("❌ Telegram intro error:", err.message);
  }
}
