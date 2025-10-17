import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../../lib/supabaseClient";
import { ClipboardList, Trash2, Image as ImageIcon } from "lucide-react";
import Papa from "papaparse";

export default function RouteAssignment() {
  const [houseList, setHouseList] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [guardName, setGuardName] = useState("");
  const [selectedHouse, setSelectedHouse] = useState("");
  const [streetName, setStreetName] = useState("");
  const [block, setBlock] = useState("");
  const [sessionNo, setSessionNo] = useState("");
  const [statusMsg, setStatusMsg] = useState("");

  // Fetch assignments
  const fetchData = async () => {
    const { data } = await supabase
      .from("patrol_assignments")
      .select("*")
      .order("created_at", { ascending: false });
    setAssignments(data || []);
  };

  useEffect(() => {
    // Load CSV houses list
    fetch("/src/data/rumah_pru.csv")
      .then((r) => r.text())
      .then((csv) =>
        Papa.parse(csv, {
          header: true,
          complete: (res) => setHouseList(res.data.filter((x) => x.house_number)),
        })
      );
    fetchData();

    const channel = supabase
      .channel("patrol_assignments")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "patrol_assignments" },
        () => fetchData()
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  // Auto-fill street/block
  const handleSelectHouse = (num) => {
    setSelectedHouse(num);
    const rec = houseList.find((x) => x.house_number === num);
    if (rec) {
      setStreetName(rec.street_name || "");
      setBlock(rec.block || "");
    }
  };

  // Insert new task
  const handleAssign = async () => {
    if (!selectedHouse || !sessionNo)
      return setStatusMsg("⚠️ Please complete all required fields.");

    const { error } = await supabase.from("patrol_assignments").insert([
      {
        guard_name: guardName || null,
        community_name: "Prima Residensi Utama",
        house_no: selectedHouse,
        street_name: streetName,
        block,
        session_no: Number(sessionNo),
        status: "pending",
        photo_url: null,
      },
    ]);
    setStatusMsg(error ? "❌ Failed to add assignment." : "✅ Assignment added successfully!");
    setGuardName("");
    setSelectedHouse("");
    setStreetName("");
    setBlock("");
    setSessionNo("");
    fetchData();
  };

  // Delete assignment
  const handleDelete = async (id) => {
    if (!confirm("Delete this assignment?")) return;
    await supabase.from("patrol_assignments").delete().eq("id", id);
    fetchData();
  };

  return (
    <motion.div
      className="bg-white rounded-2xl shadow-md p-6 mt-10"
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
        <ClipboardList className="text-accent w-6 h-6" />
        Route Assignment — Admin PRO v5
      </h2>

      {/* Form Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 mb-5">
        <input
          placeholder="(Optional) Guard Name"
          value={guardName}
          onChange={(e) => setGuardName(e.target.value)}
          className="border rounded-xl px-3 py-2 focus:ring-2 focus:ring-accent"
        />
        <select
          value={selectedHouse}
          onChange={(e) => handleSelectHouse(e.target.value)}
          className="border rounded-xl px-3 py-2 focus:ring-2 focus:ring-accent"
        >
          <option value="">Select House Number</option>
          {houseList.map((r, i) => (
            <option key={i} value={r.house_number}>
              {r.house_number}
            </option>
          ))}
        </select>
        <input
          value={streetName}
          disabled
          className="border rounded-xl px-3 py-2 bg-gray-100"
          placeholder="Street"
        />
        <input
          value={block}
          disabled
          className="border rounded-xl px-3 py-2 bg-gray-100"
          placeholder="Block"
        />
        <select
          value={sessionNo}
          onChange={(e) => setSessionNo(e.target.value)}
          className="border rounded-xl px-3 py-2 focus:ring-2 focus:ring-accent"
        >
          <option value="">Select Session</option>
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <option key={s} value={s}>
              Session {s}
            </option>
          ))}
        </select>
        <button
          onClick={handleAssign}
          className="bg-accent text-white rounded-xl px-4 py-2 hover:bg-accent/90 transition"
        >
          Assign
        </button>
      </div>

      {statusMsg && <p className="text-sm text-gray-500 mb-3">{statusMsg}</p>}

      {/* Table Section */}
      <div className="overflow-x-auto">
        <table className="w-full border text-sm">
          <thead className="bg-soft text-left">
            <tr>
              <th className="p-3">Guard</th>
              <th className="p-3">House No</th>
              <th className="p-3">Street</th>
              <th className="p-3">Block</th>
              <th className="p-3 text-center">Session</th>
              <th className="p-3 text-center">Photo Proof</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((a) => (
              <tr key={a.id} className="border-b hover:bg-gray-50 transition">
                <td className="p-3">{a.guard_name || "-"}</td>
                <td className="p-3">{a.house_no}</td>
                <td className="p-3">{a.street_name}</td>
                <td className="p-3">{a.block}</td>
                <td className="p-3 text-center">{a.session_no}</td>
                <td className="p-3 text-center">
                  {a.photo_url ? (
                    <a
                      href={a.photo_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-500 underline"
                    >
                      View
                    </a>
                  ) : (
                    <span className="text-gray-400 italic flex items-center justify-center gap-1">
                      <ImageIcon className="w-4 h-4" /> None
                    </span>
                  )}
                </td>
                <td className="p-3 text-center">
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
