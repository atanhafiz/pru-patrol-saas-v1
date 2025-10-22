import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../../lib/supabaseClient";
import { Clock, Download } from "lucide-react";

export default function ActivityLogTable() {
  const [logs, setLogs] = useState([]);
  const [guardFilter, setGuardFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchLogs = async () => {
    let query = supabase.from("activity_log").select("*").order("created_at", { ascending: false });

    if (guardFilter) query = query.ilike("guard_name", `%${guardFilter}%`);
    if (dateFrom) query = query.gte("created_at", dateFrom);
    if (dateTo) query = query.lte("created_at", dateTo + "T23:59:59");

    const { data, error } = await query;
    if (!error && data) setLogs(data);
  };

  useEffect(() => {
    fetchLogs();
    const channel = supabase
      .channel("activity_log_realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity_log" }, (payload) =>
        setLogs((prev) => [payload.new, ...prev])
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const exportCSV = () => {
    if (!logs.length) return;
    const header = "Event Type,Description,Guard,Time\n";
    const rows = logs
      .map((l) => {
        const formattedDate =
          l.created_at && !isNaN(Date.parse(l.created_at))
            ? new Date(l.created_at).toLocaleString("en-MY", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "—";
        
        return [
          l.event_type || "—",
          `"${(l.description || "No description").replace(/"/g, '""')}"`,
          l.guard_name || l.guard || "Unknown",
          formattedDate,
        ].join(",");
      })
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity_log_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      className="bg-white rounded-2xl shadow-md p-6 mt-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-primary">🗂️ Activity Log</h2>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-lg shadow hover:bg-accent/90 transition"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="text"
          placeholder="Search guard..."
          value={guardFilter}
          onChange={(e) => setGuardFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-accent flex-1 min-w-[160px]"
        />
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-accent"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-accent"
        />
        <button
          onClick={fetchLogs}
          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
        >
          Filter
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border text-sm">
          <thead className="bg-soft text-left">
            <tr>
              <th className="p-3">Type</th>
              <th className="p-3">Description</th>
              <th className="p-3">Guard</th>
              <th className="p-3">Time</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => {
              const formattedDate =
                l.created_at && !isNaN(Date.parse(l.created_at))
                  ? new Date(l.created_at).toLocaleString("en-MY", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—";

              return (
                <tr key={l.id} className="border-b hover:bg-gray-50 transition">
                  <td className="p-3 font-semibold text-primary">
                    {l.event_type || "—"}
                  </td>
                  <td className="p-3 text-gray-600">
                    {l.description || "No description"}
                  </td>
                  <td className="p-3 text-gray-700 font-medium">
                    {l.guard_name || l.guard || "Unknown"}
                  </td>
                  <td className="p-3 flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {formattedDate}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
