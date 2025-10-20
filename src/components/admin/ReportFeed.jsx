import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import { supabase } from "../../lib/supabaseClient";
import { AlertTriangle, Clock, Image, Trash2 } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,  // delay between each card
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.25 } },
};

export default function ReportFeed() {
  const [reports, setReports] = useState([]);
  const [isArchiving, setIsArchiving] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20);

  const fetchReports = async () => {
    const { data, error } = await supabase
      .from("incidents")
      .select("*")
      .eq("status", "active")
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

  return (
    <motion.div
      className="bg-gradient-to-br from-white to-soft rounded-3xl shadow-lg p-8 mt-10 border border-gray-100"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-extrabold text-primary flex items-center gap-2">
          <AlertTriangle className="w-7 h-7 text-yellow-500" />
          Live Incident Reports
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
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {reports.slice(0, visibleCount).map((r, idx) => (
              <motion.div
                key={r.id}
                variants={cardVariants}
                layout
                className="rounded-2xl bg-white shadow-md hover:shadow-2xl transition border border-gray-100 overflow-hidden relative"
              >
              {/* Delete Button */}
              <button
                onClick={async () => {
                  if (confirm("Delete this incident report?")) {
                    const { error } = await supabase.from("incidents").delete().eq("id", r.id);
                    if (!error) {
                      toast.success("✅ Incident deleted successfully!", {
                        duration: 4000,
                        position: "bottom-right",
                      });
                      fetchReports();
                    } else {
                      toast.error("❌ Failed to delete incident. Please try again.", {
                        duration: 4000,
                        position: "bottom-right",
                      });
                    }
                  }
                }}
                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow transition z-10"
                title="Delete Incident"
              >
                <Trash2 className="w-4 h-4" />
              </button>

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
          </AnimatePresence>
        </motion.div>
      )}

      {/* Load More Button */}
      {visibleCount < reports.length && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => setVisibleCount((prev) => prev + 20)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow transition"
          >
            Load More
          </button>
        </div>
      )}
    </motion.div>
  );
}
