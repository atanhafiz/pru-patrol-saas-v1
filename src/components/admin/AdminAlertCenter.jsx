import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../lib/supabaseClient";
import { Bell, Clock, AlertTriangle } from "lucide-react";

export default function AdminAlertCenter() {
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);

  const fetchAlerts = async () => {
    const { data, error } = await supabase
      .from("incidents")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setAlerts(data);
  };

  useEffect(() => {
    fetchAlerts();
    const channel = supabase
      .channel("alert_center")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "incidents" },
        (payload) => setAlerts((prev) => [payload.new, ...prev])
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-lg shadow hover:bg-accent/90 transition"
      >
        <Bell className="w-5 h-5" />
        Alert Center
      </button>

      {/* Slide-in Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed top-0 right-0 w-96 h-full bg-white shadow-2xl z-50 flex flex-col"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex justify-between items-center p-4 border-b bg-soft">
              <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                <AlertTriangle className="text-red-500 w-5 h-5" /> Alert Center
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-500 hover:text-primary"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {alerts.length === 0 ? (
                <p className="text-gray-400 italic">No incidents yet.</p>
              ) : (
                alerts.map((a) => (
                  <motion.div
                    key={a.id}
                    className="border rounded-xl p-3 shadow-sm hover:shadow-md transition"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex justify-between items-start">
                      <p className="font-semibold text-primary flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        {a.description}
                      </p>
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />{" "}
                        {new Date(a.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {a.photo_url && (
                      <a
                        href={a.photo_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-accent hover:underline mt-2 block"
                      >
                        View Photo
                      </a>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
