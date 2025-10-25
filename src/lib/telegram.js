// ✅ AHE SmartPatrol v2.0 - Telegram Integration (English)
// Clean English captions, works with RouteList & Selfie functions

export const sendTelegramPhoto = async (photoUrl, caption) => {
  try {
    const botToken = "8441973521:AAGfPTUthK-ecZeuN4-qTIqIO0131pnRWJE";
    const chatId = "392785272"; // your main Telegram chat/group ID

    const formData = new FormData();
    formData.append("chat_id", chatId);
    formData.append("photo", photoUrl);
    formData.append(
      "caption",
      caption.replace(/\*/g, "") // remove Telegram bold chars for safety
    );
    formData.append("parse_mode", "Markdown");

    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Telegram API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    if (!data.ok) throw new Error(data.description);

    console.log("✅ Telegram alert sent successfully:", caption.slice(0, 60));
  } catch (err) {
    console.error("❌ Telegram send error:", err.message);
    throw err;
  }
};
// ✅ Text-only Telegram message (for patrol summary)
export async function sendTelegramMessage(text) {
  try {
    const token = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
    const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const body = { chat_id: chatId, text, parse_mode: "Markdown" };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`Telegram sendMessage failed (${res.status})`);
    console.log("✅ Telegram text sent:", text);
  } catch (err) {
    console.error("❌ Telegram message error:", err.message);
  }
}
