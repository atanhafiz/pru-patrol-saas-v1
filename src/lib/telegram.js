// ✅ AHE SmartPatrol – Telegram API helper
// Unified helper to send both photo and text messages via Telegram Bot API.

export async function sendTelegramPhoto(photoUrl, caption) {
  try {
    const token = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
    const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;

    const url = `https://api.telegram.org/bot${token}/sendPhoto`;
    const body = {
      chat_id: chatId,
      photo: photoUrl,
      caption,
      parse_mode: "Markdown",
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`sendPhoto failed (${res.status})`);
    console.log("✅ Telegram photo sent:", caption);
  } catch (err) {
    console.error("❌ Telegram photo error:", err.message);
  }
}

// ✅ Text-only message (used for patrol summary)
export async function sendTelegramMessage(text) {
  try {
    const token = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
    const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const body = {
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`sendMessage failed (${res.status})`);
    console.log("✅ Telegram text sent:", text);
  } catch (err) {
    console.error("❌ Telegram message error:", err.message);
  }
}
