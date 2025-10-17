import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { sendTelegramPhoto } from "../../lib/telegram";
import {
  ShieldCheck,
  ClipboardCheck,
  Wifi,
  Activity,
  Bell,
  Users,
  Map,
  Trash2,
  MapPin,
} from "lucide-react";
import MapRealtime from "../../components/shared/MapRealtime";
import ReportFeed from "../../components/admin/ReportFeed";
import RouteAssignment from "../../components/admin/RouteAssignment";
import AdminAlert from "../../components/admin/AdminAlert";
import AdminAlertCenter from "../../components/admin/AdminAlertCenter";
import RouteStatusAlert from "../../components/admin/RouteStatusAlert";

// ✅ Reusable component for Live Guard Map button
function LiveGuardMapButton() {
  return (
    <Link
      to="/admin/map"
      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow transition"
    >
      <MapPin className="w-4 h-4" />
      Live Guard Tracking Map
    </Link>
  );
}

export default function AdminDashboard() {
  // 🧾 Activity Log State
  const [activityLogs, setActivityLogs] = useState([]);
  
  // 📋 Patrol Assignments State
  const [assignments, setAssignments] = useState([]);
  
  // 📊 Dashboard Metrics State
  const [attendanceToday, setAttendanceToday] = useState(0);
  const [activePatrols, setActivePatrols] = useState(0);
  const [pendingReports, setPendingReports] = useState(0);
  const [incidentsToday, setIncidentsToday] = useState(0);

  // 🧾 Activity Log Auto-Fetch
  useEffect(() => {
    fetchLogs();
    fetchAssignments();
    fetchDashboardMetrics();

    // subscribe to realtime changes (optional live)
    const channel = supabase
      .channel("activity_log_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "activity_log" },
        (payload) => {
          fetchLogs();
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from("activity_log")
      .select("*")
      .order("time", { ascending: false })
      .limit(50);
    if (!error) setActivityLogs(data || []);
  };

  const fetchAssignments = async () => {
    const { data, error } = await supabase
      .from("patrol_assignments")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setAssignments(data || []);
  };

  const fetchDashboardMetrics = async () => {
    try {
      // Get today's date range
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

      // Fetch attendance today
      const { count: attendanceCount } = await supabase
        .from("attendance_log")
        .select("*", { count: "exact" })
        .gte("created_at", startOfDay);
      setAttendanceToday(attendanceCount || 0);

      // Fetch active patrols (pending assignments)
      const { count: patrolsCount } = await supabase
        .from("patrol_assignments")
        .select("*", { count: "exact" })
        .eq("status", "pending");
      setActivePatrols(patrolsCount || 0);

      // Fetch pending reports (active incidents)
      const { count: reportsCount } = await supabase
        .from("incidents")
        .select("*", { count: "exact" })
        .eq("status", "active");
      setPendingReports(reportsCount || 0);

      // Fetch incidents today
      const { count: incidentsCount } = await supabase
        .from("incidents")
        .select("*", { count: "exact" })
        .gte("created_at", startOfDay);
      setIncidentsToday(incidentsCount || 0);
    } catch (err) {
      console.error("Error fetching dashboard metrics:", err);
    }
  };

  // 🧹 Clear Status Button
  const clearStatus = async () => {
    if (!confirm("Are you sure you want to clear all logs?")) return;
    const { error } = await supabase.from("activity_log").delete().neq("id", 0);
    if (!error) {
      alert("✅ All activity logs cleared!");
      fetchLogs();
    } else {
      alert("❌ Failed to clear logs: " + error.message);
    }
  };

  // 🧹 Function to clear today's completed patrol assignments + Telegram notify
  const clearTodayTasks = async () => {
    if (!confirm("Clear today's completed tasks?")) return;
    const today = new Date().toISOString().split("T")[0];
    const { error } = await supabase
      .from("patrol_assignments")
      .delete()
      .eq("status", "completed")
      .gte("created_at", today + "T00:00:00.000Z");

    if (error) {
      alert("❌ Failed to clear: " + error.message);
    } else {
      alert("✅ All completed tasks for today cleared!");
      fetchAssignments();

      // 🧾 Send Telegram alert
      try {
        const caption = `🧹 Patrol Tasks Cleared (by Admin)\n👤 Admin cleared all completed routes\n📅 Date: ${new Date().toLocaleDateString()}\n✅ Status: Tasks successfully cleared from database.`;
        const dummyImage = "https://upload.wikimedia.org/wikipedia/commons/8/84/Example.svg";
        await sendTelegramPhoto(dummyImage, caption);
      } catch (err) {
        console.error("Telegram alert failed:", err.message);
      }
    }
  };

  // 🧩 Determine if all today's tasks are completed
  const allCompletedToday = assignments?.length > 0 && assignments.every((a) => {
    const createdDate = new Date(a.created_at).toISOString().split("T")[0];
    const today = new Date().toISOString().split("T")[0];
    return a.status === "completed" && createdDate === today;
  });

  const metrics = [
    {
      title: "Total Attendance Today",
      value: attendanceToday,
      icon: <Users className="text-accent w-6 h-6" />,
      gradient: "from-blue-500 to-cyan-400",
    },
    {
      title: "Active Patrols",
      value: activePatrols,
      icon: <ShieldCheck className="text-green-400 w-6 h-6" />,
      gradient: "from-green-500 to-emerald-400",
    },
    {
      title: "Pending Reports",
      value: pendingReports,
      icon: <ClipboardCheck className="text-yellow-400 w-6 h-6" />,
      gradient: "from-yellow-400 to-orange-400",
    },
    {
      title: "Total Incidents Today",
      value: incidentsToday,
      icon: <Bell className="text-purple-400 w-6 h-6" />,
      gradient: "from-purple-500 to-pink-400",
    },
  ];

  const activities = [
    "👮 Guard Amir started patrol at Prima Residensi Utama",
    "📸 Incident reported by Guard Danial (photo attached)",
    "✅ Guard Naim completed patrol at Prima Residensi Utama",
    "⚠️ Guard Zuraidi connection lost, reconnecting...",
    "📍 New checkpoint added at Prima Residensi Utama – Level 3",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-soft via-white to-soft p-10">
      <motion.div
        className="mb-10 flex justify-between items-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div>
          <h1 className="text-4xl font-extrabold text-primary mb-1">
            Admin Dashboard
          </h1>
          <p className="text-gray-500 text-lg">
            Welcome back,{" "}
            <span className="font-semibold">System Admin</span> 👋
          </p>
        </div>
        <div className="flex items-center gap-4">
          <AdminAlertCenter />
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.6 }}
      >
        <div className="flex flex-wrap gap-4">
          <LiveGuardMapButton />
          <Link
            to="/admin/incidents"
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-xl flex items-center gap-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <Bell className="w-5 h-5" />
            <span className="font-semibold">🚨 Incident Reports</span>
          </Link>
        </div>
      </motion.div>

      {/* Metric Cards */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10"
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
        {metrics.map((item, i) => (
          <motion.div
            key={i}
            className={`p-6 rounded-2xl shadow-md bg-gradient-to-br ${item.gradient} text-white flex flex-col justify-between hover:shadow-2xl transition`}
            whileHover={{ scale: 1.05 }}
          >
            <div className="flex justify-between items-center mb-2">
              <p className="font-medium">{item.title}</p>
              {item.icon}
            </div>
            <h2 className="text-4xl font-extrabold">{item.value}</h2>
          </motion.div>
        ))}
      </motion.div>

      {/* Core Modules */}
      <MapRealtime />
      <ReportFeed />
      <RouteAssignment />
      <AdminAlert />
      <RouteStatusAlert />

      {/* Activity Log Table */}
      <motion.div
        className="bg-white rounded-2xl shadow-md p-6 mt-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-primary flex items-center gap-2">
            <Activity className="w-6 h-6 text-accent" /> 📜 Activity Log
          </h2>
          <div className="flex gap-2">
            {allCompletedToday && (
              <button
                onClick={clearTodayTasks}
                className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg shadow hover:shadow-lg transition"
              >
                🧹 Clear Today's Task
              </button>
            )}
            <button
              onClick={clearStatus}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow hover:shadow-lg transition"
            >
              <Trash2 className="w-4 h-4" /> 🧹 Clear Status
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-200 rounded-lg">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-3 font-semibold text-gray-700">Type</th>
                <th className="p-3 font-semibold text-gray-700">Description</th>
                <th className="p-3 font-semibold text-gray-700">Guard</th>
                <th className="p-3 font-semibold text-gray-700">Time</th>
              </tr>
            </thead>
            <tbody>
              {activityLogs.length > 0 ? (
                activityLogs.map((log, idx) => (
                  <motion.tr
                    key={log.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * idx }}
                  >
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        log.type === 'checkin' ? 'bg-green-100 text-green-800' :
                        log.type === 'checkout' ? 'bg-red-100 text-red-800' :
                        log.type === 'patrol' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {log.type}
                      </span>
                    </td>
                    <td className="p-3 text-gray-700">{log.description}</td>
                    <td className="p-3 font-medium text-gray-800">{log.guard_name}</td>
                    <td className="p-3 text-gray-600">
                      {new Date(log.time).toLocaleString()}
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="p-6 text-center text-gray-500">
                    No activity logs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      <motion.div
        className="text-center mt-12 text-gray-400 text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        © {new Date().getFullYear()} AHE Tech • Secure Patrol Management System
      </motion.div>
    </div>
  );
}
