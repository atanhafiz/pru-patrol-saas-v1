// ✅ AHE SmartPatrol Telegram Helper (Restored Original)
// Centralized helper untuk semua jenis mesej dan gambar Telegram

const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
const CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID;
const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

// Text message biasa
export async function sendTelegramMessage(text) {
  try {
    await fetch(`${BASE_URL}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
        parse_mode: "Markdown",
      }),
    });
  } catch (err) {
    console.error("Telegram Message Error:", err.message);
  }
}

// Hantar gambar (Selfie, Snap, etc)
export async function sendTelegramPhoto(photoUrl, caption = "") {
  try {
    const formData = new FormData();
    formData.append("chat_id", CHAT_ID);
    formData.append("photo", photoUrl);
    formData.append("caption", caption);
    formData.append("parse_mode", "Markdown");

    await fetch(`${BASE_URL}/sendPhoto`, {
      method: "POST",
      body: formData,
    });
  } catch (err) {
    console.error("Telegram Photo Error:", err.message);
  }
}

// (Optional) Untuk mesej pertama masa guard mula aktif
export async function sendTelegramIntro(guardName = "Unknown Guard") {
  const intro = `🛡️ *${guardName}* has started patrol.`;
  await sendTelegramMessage(intro);
}
