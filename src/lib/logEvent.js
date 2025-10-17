import { supabase } from "./supabaseClient";

/**
 * Log event ke activity_log table
 * @param {string} type - jenis event, contoh: "INCIDENT", "ROUTE", "CHECKIN"
 * @param {string} description - keterangan ringkas
 * @param {string} userRole - role user (admin/guard)
 */
export async function logEvent(type, description, userRole) {
  try {
    const { error } = await supabase.from("activity_log").insert([
      {
        type,
        description,
        user_role: userRole,
        created_at: new Date().toISOString(),
      },
    ]);
    if (error) throw error;
    console.log("✅ Event logged successfully");
  } catch (err) {
    console.error("❌ Error logging event:", err);
  }
}
