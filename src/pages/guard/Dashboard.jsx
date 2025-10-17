import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../../lib/supabaseClient";
import { Activity, Camera, ListChecks, Clock } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function GuardDashboard() {
  const [attendance, setAttendance] = useState(0);
  const [routes, setRoutes] = useState({ total: 0, done: 0 });
  const [incidents, setIncidents] = useState(0);
  const [lastCheck, setLastCheck] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [guardName, setGuardName] = useState(localStorage.getItem("guardName") || "");
  const [plateNo, setPlateNo] = useState(localStorage.getItem("plateNo") || "");
  const [showProfileForm, setShowProfileForm] = useState(false);

  const fetchData = async () => {
    const [
      { count: attCount, data: attData },
      { data: rData },
      { count: incCount },
    ] = await Promise.all([
      supabase.from("attendance").select("*", { count: "exact" }),
      supabase
        .from("patrol_assignments")
        .select("*")
        .eq("guard_name", guardName),
      supabase.from("incidents").select("*", { count: "exact" }),
    ]);

    if (attData?.length) {
      const latest = attData.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      )[0];
      setLastCheck(latest);

      // group by day
      const grouped = {};
      attData.forEach((a) => {
        const day = new Date(a.created_at).toLocaleDateString("en-GB");
        grouped[day] = (grouped[day] || 0) + 1;
      });
      const formatted = Object.entries(grouped).map(([date, count]) => ({
        date,
        count,
      }));
      setChartData(formatted.slice(-7)); // last 7 days
    }

    setAttendance(attCount || 0);
    if (rData) {
      const done = rData.filter((r) => r.status === "completed").length;
      setRoutes({ total: rData.length, done });
    }
    setIncidents(incCount || 0);
  };

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    localStorage.setItem("guardName", guardName);
    localStorage.setItem("plateNo", plateNo);
    setShowProfileForm(false);
    alert("✅ Profile updated successfully!");
  };

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel("guard_dashboard")
      .on("postgres_changes", { event: "*", schema: "public" }, () =>
        fetchData()
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const cards = [
    {
      title: "Attendance",
      value: attendance,
      icon: <Camera className="w-6 h-6 text-accent" />,
      color: "from-blue-500 to-cyan-400",
    },
    {
      title: "Patrol Completed",
      value: `${routes.done}/${routes.total}`,
      icon: <ListChecks className="w-6 h-6 text-green-400" />,
      color: "from-green-500 to-emerald-400",
    },
    {
      title: "Incidents Reported",
      value: incidents,
      icon: <Activity className="w-6 h-6 text-yellow-400" />,
      color: "from-yellow-400 to-orange-400",
    },
  ];

  return (
    <div className="min-h-screen bg-soft p-6">
      <motion.div
        className="flex justify-between items-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-primary">Guard Dashboard</h1>
        <button
          onClick={() => setShowProfileForm(!showProfileForm)}
          className="bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent/90 transition"
        >
          {guardName ? `👤 ${guardName}` : "⚙️ Setup Profile"}
        </button>
      </motion.div>

      {/* Profile Setup Form */}
      {showProfileForm && (
        <motion.div
          className="bg-white rounded-2xl shadow-md p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-xl font-semibold text-primary mb-4">Guard Profile Setup</h3>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Guard Name
              </label>
              <input
                type="text"
                value={guardName}
                onChange={(e) => setGuardName(e.target.value)}
                placeholder="Enter your name"
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-accent outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plate Number
              </label>
              <input
                type="text"
                value={plateNo}
                onChange={(e) => setPlateNo(e.target.value)}
                placeholder="Enter your plate number"
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-accent outline-none"
                required
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-accent text-white px-6 py-2 rounded-xl hover:bg-accent/90 transition"
              >
                Save Profile
              </button>
              <button
                type="button"
                onClick={() => setShowProfileForm(false)}
                className="bg-gray-500 text-white px-6 py-2 rounded-xl hover:bg-gray-600 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Summary cards */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: {
            opacity: 1,
            y: 0,
            transition: { delayChildren: 0.2, staggerChildren: 0.1 },
          },
        }}
      >
        {cards.map((c, i) => (
          <motion.div
            key={i}
            className={`p-6 rounded-2xl text-white bg-gradient-to-br ${c.color} shadow-md hover:shadow-xl transition flex justify-between`}
            whileHover={{ scale: 1.03 }}
          >
            <div>
              <p className="text-sm opacity-80">{c.title}</p>
              <h2 className="text-3xl font-extrabold">{c.value}</h2>
            </div>
            {c.icon}
          </motion.div>
        ))}
      </motion.div>

      {/* Last Check-In */}
      {lastCheck && (
        <motion.div
          className="bg-white rounded-2xl shadow-md p-5 flex justify-between items-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h3 className="font-semibold text-primary">Last Check-In</h3>
            <p className="text-sm text-gray-600 mt-1">
              {new Date(lastCheck.created_at).toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              GPS: {lastCheck.lat.toFixed(4)}, {lastCheck.lng.toFixed(4)}
            </p>
          </div>
          <Clock className="w-8 h-8 text-accent" />
        </motion.div>
      )}

      {/* Attendance History Chart */}
      {chartData.length > 0 && (
        <motion.div
          className="bg-white rounded-2xl shadow-md p-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h3 className="text-xl font-semibold text-primary mb-4">
            Attendance History (7 Days)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="date" stroke="#8884d8" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#00A8E8"
                strokeWidth={3}
                dot={{ r: 5, strokeWidth: 2, fill: "#fff" }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </div>
  );
}
