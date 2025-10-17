import { supabase } from "./supabaseClient";

/**
 * Log event ke activity_log table
 * @param {string} eventType - jenis event, contoh: "INCIDENT", "ROUTE", "CHECKIN"
 * @param {string} description - keterangan ringkas
 * @param {string} guardName - nama guard (optional)
 */
export async function logEvent(eventType, description, guardName = "-") {
  try {
    const { error } = await supabase.from("activity_log").insert([
      { event_type: eventType, description, guard_name: guardName },
    ]);
    if (error) console.error("Log insert failed:", error.message);
  } catch (err) {
    console.error("LogEvent Error:", err.message);
  }
}
