/**
 * Centralized Telegram API functions for v1.1
 * Handles all Telegram notifications with consistent formatting
 */

export async function sendTelegramAlert(type, payload) {
  const { message } = payload;
  const TELEGRAM_BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
  const TELEGRAM_CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID;
  
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn("⚠️ Telegram credentials not configured");
    return;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        chat_id: TELEGRAM_CHAT_ID, 
        text: `[${type}] ${message}`,
        parse_mode: "HTML"
      }),
    });

    if (!response.ok) {
      throw new Error(`Telegram API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    if (!result.ok) {
      throw new Error(`Telegram API error: ${result.description}`);
    }

    console.log("✅ Telegram alert sent successfully");
    return result;
  } catch (err) {
    console.error("❌ Error sending Telegram alert:", err);
    throw err;
  }
}

export async function sendTelegramPhoto(photoUrl, caption) {
  const TELEGRAM_BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
  const TELEGRAM_CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID;
  
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn("⚠️ Telegram credentials not configured");
    return;
  }

  try {
    const formData = new FormData();
    formData.append('chat_id', TELEGRAM_CHAT_ID);
    formData.append('photo', photoUrl);
    formData.append('caption', caption);
    formData.append('parse_mode', 'HTML');
    
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
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
    
    console.log("✅ Telegram photo sent successfully");
    return result;
  } catch (err) {
    console.error("❌ Error sending Telegram photo:", err);
    throw err;
  }
}

// Alert type constants for consistency
export const TELEGRAM_ALERT_TYPES = {
  INCIDENT_REPORT: "INCIDENT_REPORT",
  ATTENDANCE_CHECKIN: "ATTENDANCE_CHECKIN", 
  SPEED_ALERT: "SPEED_ALERT",
  PATROL_UPDATE: "PATROL_UPDATE",
  PATROL_CLEARED: "PATROL_CLEARED",
  PATROL_SESSION_CLEARED: "PATROL_SESSION_CLEARED"
};
