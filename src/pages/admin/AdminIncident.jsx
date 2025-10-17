import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function AdminIncident() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {incidents.map((i) => (
            <div key={i.id} className="border rounded-xl shadow p-4 bg-white">
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
