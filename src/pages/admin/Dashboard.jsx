import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { sendTelegramPhoto } from "../../lib/telegram";
import {
  ShieldCheck,
  ClipboardCheck,
  Bell,
  Users,
} from "lucide-react";

import MapRealtime from "../../components/shared/MapRealtime";
import RouteAssignment from "../../components/admin/RouteAssignment";
import RouteStatusAlert from "../../components/admin/RouteStatusAlert";

// ✅ Import layout clean baru
import AdminLayout_Clean from "../../layouts/AdminLayout_Clean";


export default function Dashboard() {
  const [assignments, setAssignments] = useState([]);
  const [attendanceToday, setAttendanceToday] = useState(0);
  const [activePatrols, setActivePatrols] = useState(0);
  const [pendingReports, setPendingReports] = useState(0);
  const [incidentsToday, setIncidentsToday] = useState(0);

  useEffect(() => {
    fetchAssignments();
    fetchDashboardMetrics();
  }, []);


  const fetchAssignments = async () => {
    const { data, error } = await supabase
      .from("patrol_assignments")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setAssignments(data || []);
  };

  const fetchDashboardMetrics = async () => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();

      const { count: attendanceCount } = await supabase
        .from("attendance_log")
        .select("*", { count: "exact" })
        .gte("created_at", startOfDay);
      setAttendanceToday(attendanceCount || 0);

      const { count: patrolsCount } = await supabase
        .from("patrol_assignments")
        .select("*", { count: "exact" })
        .eq("status", "pending");
      setActivePatrols(patrolsCount || 0);

      const { count: reportsCount, error: reportsError } = await supabase
        .from("incidents")
        .select("*", { count: "exact" })
        .eq("status", "active");
      if (reportsError) {
        console.error("❌ Supabase incidents (active) error:", reportsError.message);
      } else {
        console.log("✅ Supabase incidents (active) fetched:", reportsCount);
      }
      setPendingReports(reportsCount || 0);

      const { count: incidentsCount, error: incidentsError } = await supabase
        .from("incidents")
        .select("*", { count: "exact" })
        .gte("created_at", startOfDay);
      if (incidentsError) {
        console.error("❌ Supabase incidents (today) error:", incidentsError.message);
      } else {
        console.log("✅ Supabase incidents (today) fetched:", incidentsCount);
      }
      setIncidentsToday(incidentsCount || 0);
    } catch (err) {
      console.error("Error fetching dashboard metrics:", err);
    }
  };


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

      try {
        const caption = `🧹 Patrol Tasks Cleared (by Admin)\n👤 Admin cleared all completed routes\n📅 Date: ${new Date().toLocaleDateString()}`;
        const dummyImage =
          "https://upload.wikimedia.org/wikipedia/commons/8/84/Example.svg";
        await sendTelegramPhoto(dummyImage, caption);
      } catch (err) {
        console.error("Telegram alert failed:", err.message);
      }
    }
  };

  const allCompletedToday =
    assignments?.length > 0 &&
    assignments.every((a) => {
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

  return (
    <AdminLayout_Clean>
      <div className="min-h-screen bg-gradient-to-br from-[#f7faff] via-white to-[#edf3ff] p-4 sm:p-10">
      <motion.div
        className="bg-gradient-to-br from-white to-[#f5f9ff] border border-gray-100 rounded-2xl shadow-sm p-5 sm:p-6 mb-4 sm:mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div>
          <h1 className="text-4xl font-extrabold text-[#0B132B] mb-1">
            Admin Dashboard
          </h1>
          <p className="text-gray-500 text-lg">
            Welcome,{" "}
            <span className="font-semibold">Admin</span>
          </p>
          <p className="text-sm text-gray-500">Monitor patrols, incidents, and reports in real time.</p>
        </div>
      </motion.div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4 mb-6">
          <Link
            to="/admin/incidents"
            className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white px-4 py-2 rounded-xl shadow-md hover:shadow-lg transition"
          >
            <Bell className="w-4 h-4" />
            Incident Reports
          </Link>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-10">
          {metrics.map((item, i) => (
            <motion.div
              key={i}
              className="bg-gradient-to-br from-white to-[#f5f9ff] border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition p-4 sm:p-5"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-gray-500">{item.title}</p>
                {item.icon && <div className="opacity-70 w-5 h-5">{item.icon}</div>}
              </div>
              <h2 className="text-3xl font-bold text-[#0B132B] mt-1">{item.value}</h2>
            </motion.div>
          ))}
        </div>

        {/* Core Modules */}
        <MapRealtime isTrackingPaused={false} />
        <div className="my-6"></div>
        <RouteAssignment />
        <RouteStatusAlert />


        <motion.div
          className="text-center mt-12 text-gray-400 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          © {new Date().getFullYear()} AHE SmartPatrol • Secure Patrol Management System
        </motion.div>
      </div>
    </AdminLayout_Clean>
  );
}
