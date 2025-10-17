import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../lib/supabaseClient";
import { CheckCircle } from "lucide-react";
import { Howl } from "howler";

export default function RouteStatusAlert() {
  const [statusData, setStatusData] = useState(null);

  useEffect(() => {
    const channel = supabase
      .channel("route_status_alerts")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "patrol_assignments" },
        (payload) => {
          if (payload.new.status === "completed") {
            setStatusData(payload.new);

            const sound = new Howl({
              src: [
                "https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3",
              ],
              volume: 0.5,
            });
            sound.play();

            setTimeout(() => setStatusData(null), 6000);
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  return (
    <AnimatePresence>
      {statusData && (
        <motion.div
          className="fixed bottom-8 right-8 z-50 bg-green-50 border border-green-200 shadow-2xl rounded-2xl p-5 w-80 flex flex-col gap-2"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-6 h-6" />
            <h3 className="text-lg font-bold">Route Completed!</h3>
          </div>

          <p className="text-sm text-gray-600">
            {statusData.guard_name} completed route ID: {statusData.house_id}
          </p>

          <p className="text-xs text-gray-400 text-right">
            {new Date(statusData.updated_at || statusData.created_at).toLocaleString()}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
