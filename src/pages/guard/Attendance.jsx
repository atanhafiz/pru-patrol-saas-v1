import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function Attendance() {
  const [name, setName] = useState(localStorage.getItem("guardName") || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert("Please enter your name");
      return;
    }

    setLoading(true);
    try {
      await supabase.from("attendance").insert([
        {
          guard_name: name.trim(),
          created_at: new Date().toISOString(),
        },
      ]);
      
      supabase
        .from("activity_log")
        .insert([
          {
            event_type: "ATTENDANCE",
            description: `Guard ${name} submitted attendance`,
            guard_name: name || "Unknown",
            created_at: new Date().toISOString(),
          },
        ])
        .then(({ error }) =>
          error && console.warn("⚠️ Failed to log attendance:", error.message)
        );
      alert("✅ Attendance submitted successfully");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to submit attendance");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-primary mb-2">Attendance</h1>
      <div className="bg-white/90 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 p-4 sm:p-6 max-w-md">
        <input
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border border-gray-200 p-3 rounded-xl w-full mb-4 focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-xl w-full shadow-md hover:shadow-lg transition"
        >
          {loading ? "Submitting..." : "Submit Attendance"}
        </button>
      </div>
    </div>
  );
}
  