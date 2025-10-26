// ✅ AHE SmartPatrol – Admin Incident Management (Clean UI v2.2)
// Added back button + bold description + restored image preview

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Trash2, AlertTriangle, Clock } from "lucide-react";

export default function AdminIncident() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- Fetch incidents from Supabase
  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("incidents")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setIncidents(data || []);
    } catch (err) {
      console.error("Error fetching incidents:", err.message);
      toast.error("Failed to load incidents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  // --- Delete single incident
  const deleteIncident = async (id) => {
    const confirm = window.confirm("Delete this incident?");
    if (!confirm) return;
    try {
      const { error } = await supabase.from("incidents").delete().eq("id", id);
      if (error) throw error;
      toast.success("Incident deleted");
      setIncidents((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      toast.error("Failed to delete incident");
      console.error(err.message);
    }
  };

  // --- Delete all incidents
  const clearAll = async () => {
    const confirm = window.confirm("Are you sure you want to delete ALL incidents?");
    if (!confirm) return;
    try {
      const { error } = await supabase.from("incidents").delete().neq("id", 0);
      if (error) throw error;
      toast.success("All incidents cleared");
      setIncidents([]);
    } catch (err) {
      toast.error("Failed to clear incidents");
      console.error(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7faff] p-6 sm:p-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 mb-6 flex justify-between items-center"
      >
        <div className="flex items-center gap-3">
          {/* 🔙 Back Button */}
          <button
            onClick={() => window.history.back()}
            className="p-2 rounded-full hover:bg-gray-100 transition"
            title="Back"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="w-5 h-5 text-gray-700"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div>
            <h1 className="text-3xl font-extrabold text-[#0B132B] flex items-center gap-2">
              <AlertTriangle className="text-red-500 w-7 h-7" />
              Incident Management
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Review and manage all reported incidents in real-time.
            </p>
          </div>
        </div>

        {incidents.length > 0 && (
          <button
            onClick={clearAll}
            className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-xl shadow-sm transition"
          >
            Clear All
          </button>
        )}
      </motion.div>

      {/* Content */}
      {loading ? (
        <div className="text-center text-gray-500 mt-10">Loading incidents...</div>
      ) : incidents.length === 0 ? (
        <div className="text-center text-gray-400 mt-10">No incidents reported yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {incidents.map((i) => (
            <motion.div
              key={i.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all p-5 relative"
            >
              {/* Delete Button */}
              <div className="absolute top-3 right-3">
                <button
                  onClick={() => deleteIncident(i.id)}
                  className="text-gray-400 hover:text-red-600 transition"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* ✅ Only show title if available */}
              {i.title && (
                <h3 className="font-semibold text-[#0B132B] mb-2">
                  {i.title}
                </h3>
              )}

              {/* ✅ Bold Description */}
              <p className="text-sm text-gray-900 font-semibold mb-3 whitespace-pre-line">
                {i.description || "No details provided."}
              </p>

              {/* ✅ Image Preview Fix */}
              {(i.image_url || i.photo_url) && (
                <img
                  src={i.image_url || i.photo_url}
                  alt="incident"
                  className="rounded-lg border border-gray-200 mb-3 w-full object-cover shadow-sm"
                  onError={(e) => {
                    e.target.style.display = "none";
                    console.warn("⚠️ Incident image failed to load:", i.image_url);
                  }}
                />
              )}

              {/* Footer Info */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {new Date(i.created_at).toLocaleString()}
                </div>
                <span className="font-semibold text-blue-600">
                  {i.guard_name || "Unknown Guard"}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
