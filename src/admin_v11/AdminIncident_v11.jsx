import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../lib/supabaseClient";
import { AlertTriangle, Clock, Image, Trash2 } from "lucide-react";
import LoadingSpinner from "../shared_v11/components/LoadingSpinner";
import ErrorBoundary from "../shared_v11/components/ErrorBoundary";
import { useRealtime } from "../shared_v11/hooks/useRealtime";

export default function AdminIncident_v11() {
  const [reports, setReports] = useState([]);
  const [isArchiving, setIsArchiving] = useState(false);

  // Use the centralized realtime hook
  const { data: realtimeReports, loading } = useRealtime('incidents', {
    select: "*",
    filter: { status: "active" },
    order: { created_at: "desc" }
  });

  const fetchReports = async () => {
    const { data, error } = await supabase
      .from("incidents")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false });
    if (!error) setReports(data);
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Update reports when realtime data changes
  useEffect(() => {
    if (realtimeReports) {
      setReports(realtimeReports);
    }
  }, [realtimeReports]);

  // Auto-archive old reports on component mount
  useEffect(() => {
    const autoArchiveOldReports = async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      await supabase
        .from("incidents")
        .update({ status: "archived" })
        .lt("created_at", thirtyDaysAgo)
        .eq("status", "active");
    };
    autoArchiveOldReports();
  }, []);

  const handleArchiveOldReports = async () => {
    if (!confirm("Archive all reports older than 30 days?")) return;
    
    setIsArchiving(true);
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { error } = await supabase
        .from("incidents")
        .update({ status: "archived" })
        .lt("created_at", thirtyDaysAgo)
        .eq("status", "active");
      
      if (error) throw error;
      
      alert("✅ Old reports archived successfully!");
      fetchReports(); // refresh UI
    } catch (err) {
      console.error("Archive error:", err);
      alert("❌ Failed to archive reports: " + err.message);
    } finally {
      setIsArchiving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <motion.div
        className="bg-gradient-to-br from-white to-soft rounded-3xl shadow-lg p-8 mt-10 border border-gray-100"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-extrabold text-primary flex items-center gap-2">
            <AlertTriangle className="w-7 h-7 text-yellow-500" />
            Live Incident Reports v1.1
          </h2>
          <button
            onClick={handleArchiveOldReports}
            disabled={isArchiving}
            className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            {isArchiving ? "Archiving..." : "🧹 Clear Old Reports"}
          </button>
        </div>

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
    </ErrorBoundary>
  );
}
