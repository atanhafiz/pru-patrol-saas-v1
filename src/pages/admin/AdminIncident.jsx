import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import { supabase } from "../../lib/supabaseClient";

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

export default function AdminIncident() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const fetchIncidents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("incidents")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Error fetching incidents:", error.message);
    } else {
      setIncidents(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-wrap gap-2 mb-4">
        <motion.button
          onClick={() => window.history.back()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg shadow-lg transition text-sm sm:text-base flex items-center gap-2"
          whileHover={{ x: -4, scale: 1.03 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
        >
          ← Back
        </motion.button>
        <button
          onClick={() => setShowConfirm(true)}
          className="ml-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-lg transition flex items-center gap-2"
        >
          🗑️ Clear All
        </button>
      </div>
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-primary">🚨 Incident Reports</h2>
        <button
          onClick={fetchIncidents}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500 italic">Loading reports...</p>
      ) : incidents.length === 0 ? (
        <p className="text-gray-500 italic">No incident reports found.</p>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {incidents.map((i) => (
              <motion.div
                key={i.id}
                variants={cardVariants}
                layout
                className="border rounded-xl shadow p-4 bg-white relative"
              >
              <button
                onClick={async () => {
                  if (confirm("Delete this incident report?")) {
                    const { error } = await supabase.from("incidents").delete().eq("id", i.id);
                    if (!error) {
                      toast.success("✅ Incident deleted successfully!", {
                        duration: 4000,
                        position: "bottom-right",
                      });
                      fetchIncidents();
                    } else {
                      toast.error("❌ Failed to delete incident. Please try again.", {
                        duration: 4000,
                        position: "bottom-right",
                      });
                    }
                  }
                }}
                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow transition"
                title="Delete Incident"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-primary">{i.guard_name || "Unknown Guard"}</p>
                <p className="text-xs text-gray-500">
                  {new Date(i.created_at).toLocaleString()}
                </p>
              </div>
              <p className="text-sm mb-2">
                📝 {i.message || "(No description provided)"}
              </p>
              {i.photo_url && (
                <a href={i.photo_url} target="_blank" rel="noreferrer">
                  <img
                    src={i.photo_url}
                    alt="incident"
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                </a>
              )}
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="bg-white rounded-xl shadow-2xl p-6 w-[90%] max-w-sm text-center"
          >
            <h2 className="text-xl font-bold mb-3 text-gray-800">Confirm Deletion</h2>
            <p className="text-gray-600 mb-5">Are you sure you want to delete <strong>all incident reports</strong>? This action cannot be undone.</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const { error } = await supabase.from("incidents").delete().neq("id", 0);
                  if (!error) {
                    setShowConfirm(false);
                    toast.success("✅ All incident reports cleared successfully!", {
                      duration: 4000,
                      position: "bottom-right",
                    });
                    fetchIncidents && fetchIncidents();
                  } else {
                    toast.error("❌ Failed to delete incidents. Please try again.", {
                      duration: 4000,
                      position: "bottom-right",
                    });
                  }
                }}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
              >
                Yes, Delete All
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
