import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../lib/supabaseClient";
import { AlertTriangle } from "lucide-react";
import { Howl } from "howler";

export default function AdminAlert() {
  const [alertData, setAlertData] = useState(null);

  useEffect(() => {
    console.log("🚨 ALERT-REALTIME: AdminAlert component mounted");
    // Subscribe to new incident realtime event
    const channel = supabase
      .channel("incident_alerts");
    
    console.log("🚨 ALERT-REALTIME: AdminAlert channel created", "incident_alerts");
    
    channel.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "incidents" },
      (payload) => {
        console.log("🚨 ALERT-REALTIME: AdminAlert event received", payload);
        setAlertData(payload.new);

        // 🔊 Play siren sound direct from URL (no local file)
        const sound = new Howl({
          src: [
            "https://assets.mixkit.co/sfx/preview/mixkit-security-facility-alarm-buzzer-994.mp3",
          ],
          volume: 0.6,
        });
        sound.play();

        // Auto hide after 6 seconds
        setTimeout(() => setAlertData(null), 6000);
      }
    );
    
    // Add error handling
    channel.on("system", { event: "error" }, (err) => {
      console.error("🚨 ALERT-REALTIME: AdminAlert subscription error", err);
    });
    
    channel.subscribe();
    console.log("🚨 ALERT-REALTIME: AdminAlert subscription started");

    return () => {
      console.log("🚨 ALERT-REALTIME: AdminAlert unsubscribed on unmount");
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <AnimatePresence>
      {alertData && (
        <motion.div
          className="fixed bottom-8 right-8 z-50 bg-white border border-red-200 shadow-2xl rounded-2xl p-5 w-80 flex flex-col gap-2"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-2 text-red-500">
            <AlertTriangle className="w-6 h-6" />
            <h3 className="text-lg font-bold">New Incident Report!</h3>
          </div>

          <p className="text-sm text-gray-600">
            {alertData.description || "Incident reported by guard."}
          </p>

          {alertData.photo_url && (
            <a
              href={alertData.photo_url}
              target="_blank"
              rel="noreferrer"
              className="text-accent text-sm mt-2 hover:underline"
            >
              View Photo
            </a>
          )}

          <p className="text-xs text-gray-400 text-right">
            {new Date(alertData.created_at).toLocaleString()}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
