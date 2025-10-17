export const sendTelegramPhoto = async (photoUrl, caption) => {
  try {
    const botToken = "8441973521:AAGfPTUthK-ecZeuN4-qTIqIO0131pnRWJE";
    const chatId = "392785272";
    
    const formData = new FormData();
    formData.append('chat_id', chatId);
    formData.append('photo', photoUrl);
    formData.append('caption', caption);
    
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Telegram API error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    if (!result.ok) {
      throw new Error(`Telegram API error: ${result.description}`);
    }
    
    console.log("✅ Telegram alert sent");
  } catch (err) {
    console.error("❌ Error sending Telegram alert:", err);
    throw err;
  }
};
  