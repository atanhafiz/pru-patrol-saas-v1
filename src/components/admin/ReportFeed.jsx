import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../../lib/supabaseClient";
import { AlertTriangle, Clock, Image } from "lucide-react";

export default function ReportFeed() {
  const [reports, setReports] = useState([]);

  const fetchReports = async () => {
    const { data, error } = await supabase
      .from("incidents")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setReports(data);
  };

  useEffect(() => {
    fetchReports();

    const channel = supabase
      .channel("incident_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "incidents" },
        (payload) => {
          setReports((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  return (
    <motion.div
      className="bg-gradient-to-br from-white to-soft rounded-3xl shadow-lg p-8 mt-10 border border-gray-100"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <h2 className="text-3xl font-extrabold text-primary flex items-center gap-2 mb-6">
        <AlertTriangle className="w-7 h-7 text-yellow-500" />
        Live Incident Reports
      </h2>

      {reports.length === 0 ? (
        <p className="text-gray-400 italic">No incidents reported yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((r, idx) => (
            <motion.div
              key={r.id}
              className="rounded-2xl bg-white shadow-md hover:shadow-2xl transition border border-gray-100 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * idx }}
            >
              {/* Gambar */}
              {r.photo_url ? (
                <div className="relative">
                  <img
                    src={r.photo_url}
                    alt="Incident"
                    className="h-56 w-full object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-white/80 px-2 py-1 rounded-full text-xs text-gray-600">
                    {new Date(r.created_at).toLocaleDateString()}
                  </div>
                </div>
              ) : (
                <div className="h-56 bg-gray-50 flex items-center justify-center text-gray-400">
                  <Image className="w-8 h-8" />
                </div>
              )}

              {/* Body */}
              <div className="p-4">
                <p className="font-semibold text-primary flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  {r.description}
                </p>

                <p className="text-sm text-gray-500 flex items-center gap-1 mt-2">
                  <Clock className="w-3 h-3" />
                  {new Date(r.created_at).toLocaleString()}
                </p>

                {r.photo_url && (
                  <a
                    href={r.photo_url}
                    target="_blank"
                    rel="noreferrer"
                    className="block mt-3 text-accent text-sm font-semibold hover:underline"
                  >
                    🔗 View Full Photo
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
