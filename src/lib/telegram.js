// ✅ Restored Telegram format (bold + emoji)

export const sendTelegramPhoto = async (photoUrl, caption) => {
  try {
    const botToken = "8441973521:AAGfPTUthK-ecZeuN4-qTIqIO0131pnRWJE";
    const chatId = "392785272";

    const formData = new FormData();
    formData.append("chat_id", chatId);
    formData.append("photo", photoUrl);
    formData.append("caption", caption);
    formData.append("parse_mode", "Markdown");

    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
      method: "POST",
      body: formData,
    });

    const result = await res.json();
    if (!result.ok) throw new Error(result.description);
    console.log("✅ Telegram sent:", result);
  } catch (err) {
    console.error("❌ Telegram error:", err.message);
  }
};