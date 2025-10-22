import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../../lib/supabaseClient";
import { Clock, Activity } from "lucide-react";

export default function PatrolTimeline() {
  const [events, setEvents] = useState([]);

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from("patrol_timeline")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setEvents(data);
  };

  useEffect(() => {
    fetchEvents();

    const channel = supabase
      .channel("timeline_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "patrol_timeline" },
        (payload) => setEvents((prev) => [payload.new, ...prev])
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  return (
    <motion.div
      className="min-h-screen bg-soft p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <h1 className="text-3xl font-bold text-primary mb-6 flex items-center gap-2">
        <Activity className="w-7 h-7 text-accent" /> Patrol Timeline (All Guards)
      </h1>

      {events.length === 0 ? (
        <p className="text-gray-400 italic">No patrol activity yet.</p>
      ) : (
        <div className="space-y-4">
          {events.map((e) => (
            <motion.div
              key={e.id}
              className="bg-white rounded-2xl shadow-md p-4 border-l-4 border-accent"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <p className="font-semibold text-primary">{e.event}</p>
                  <p className="text-sm text-gray-500 mt-1">👤 {e.guard_name || "Guard"}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs text-white ${
                    e.status === "completed"
                      ? "bg-green-500"
                      : e.status === "alert"
                      ? "bg-red-500"
                      : "bg-yellow-500"
                  }`}
                >
                  {e.status}
                </span>
              </div>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />{" "}
                {new Date(e.created_at).toLocaleString()}
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
