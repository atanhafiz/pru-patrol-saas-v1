import { supabase } from "./supabaseClient";

let guardChannel = null;

export const getGuardChannel = () => {
  if (!guardChannel) {
    guardChannel = supabase.channel("guard_location", {
      config: { broadcast: { ack: false } },
    });
    guardChannel.subscribe();
    console.log("🛰️ Guard channel created once and subscribed");
  }
  return guardChannel;
};

export const closeGuardChannel = () => {
  try {
    if (guardChannel) {
      supabase.removeChannel(guardChannel);
      console.log("🧹 Guard channel cleaned safely");
      guardChannel = null;
    }
  } catch (err) {
    console.warn("⚠️ Error cleaning guard channel:", err.message);
  }
};
