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
  const { guardName, plateNo, lat, lng, time, house, street, block, title, description } = data;

  switch (type) {
    case "selfieIn":
      return `🚨 *Guard On Duty*\n👮 ${guardName}\n🏍️ ${plateNo}\n📍 [Open in Google Maps](https://www.google.com/maps?q=${lat},${lng})\n🕒 ${time}`;
    case "selfieOut":
      return `✅ *Patrol Ended*\n👮 ${guardName}\n🏍️ ${plateNo}\n📍 [Last Location](https://www.google.com/maps?q=${lat},${lng})\n🕒 ${time}`;
    case "houseSnap":
      return `🏠 *Patrol Checkpoint*\n📍 ${house} ${street} (${block})\n👮 ${guardName}\n🏍️ ${plateNo}\n📌 [Open Map](https://www.google.com/maps?q=${lat},${lng})\n🕓 ${time}`;
    case "incident":
      return `🚨 *INCIDENT REPORTED*\n📄 *${title || "Untitled Incident"}*\n📝 ${description || "No description"}\n👮 Reported By: ${guardName}\n📍 [Location](https://www.google.com/maps?q=${lat},${lng})\n🕒 ${time}`;
    default:
      return `📝 ${description || "No details"}`;
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
