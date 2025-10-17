export const sendTelegramPhoto = async (photoUrl, caption) => {
    const botToken = "8441973521:AAGfPTUthK-ecZeuN4-qTIqIO0131pnRWJE"; // ✅ dalam quote
    const chatId = "392785272"; // ✅ dalam quote
  
    const message = encodeURI(caption);
    const url = `https://api.telegram.org/bot${botToken}/sendPhoto?chat_id=${chatId}&photo=${encodeURIComponent(
      photoUrl
    )}&caption=${message}`;
  
    await fetch(url);
  };
  