// PRU Patrol Sandbox v1.1 – Centralized Telegram API Helper

const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
const CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID;

export async function sendTelegramAlert(type, payload) {
  try {
    const message = `[${type}] ${payload.message}`;
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT_ID, text: message }),
    });
  } catch (error) {
    console.error("Telegram Alert Error:", error);
  }
}

export async function sendTelegramPhoto(photoUrl, caption = "") {
  try {
    const formData = new FormData();
    formData.append("chat_id", CHAT_ID);
    formData.append("photo", photoUrl);
    formData.append("caption", caption);

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
      method: "POST",
      body: formData,
    });
  } catch (error) {
    console.error("Telegram Photo Error:", error);
  }
}