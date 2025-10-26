// ✅ AHE SmartPatrol Admin Dashboard v2.5 (Completed Sessions Added)
// Clean white cards + English text + single incident button

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { Bell, ShieldCheck, ClipboardCheck, Users } from "lucide-react";
import { Link } from "react-router-dom";
import MapRealtime from "../../components/shared/MapRealtime";
import RouteAssignment from "../../components/admin/RouteAssignment";
import RouteStatusAlert from "../../components/admin/RouteStatusAlert";
import AdminLayout_Clean from "../../layouts/AdminLayout_Clean";

export default function Dashboard() {
  const [assignments, setAssignments] = useState([]);
  const [attendanceToday, setAttendanceToday] = useState(0);
  const [activePatrols, setActivePatrols] = useState(0);
  const [incidentsToday, setIncidentsToday] = useState(0);
  const [completedSessions, setCompletedSessions] = useState(0);

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
      // 🇲🇾 Malaysia timezone (UTC +8)
      const now = new Date();
      const malaysiaTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  
      // startOfDay = 12:00 AM waktu Malaysia
      const startOfDay = new Date(
        malaysiaTime.getFullYear(),
        malaysiaTime.getMonth(),
        malaysiaTime.getDate(),
        0, 0, 0
      ).toISOString();
  
      // ✅ Attendance today
      const { count: attendanceCount } = await supabase
        .from("attendance_log")
        .select("*", { count: "exact" })
        .gte("created_at", startOfDay);
      setAttendanceToday(attendanceCount || 0);
  
      // ✅ Active patrols
      const { count: patrolCount } = await supabase
        .from("patrol_assignments")
        .select("*", { count: "exact" })
        .eq("status", "pending")
        .gte("created_at", startOfDay);
      setActivePatrols(patrolCount || 0);
  
      // ✅ Incidents today
      const { count: incidentsCount } = await supabase
        .from("incidents")
        .select("*", { count: "exact" })
        .gte("created_at", startOfDay);
      setIncidentsToday(incidentsCount || 0);
  
      // ✅ Completed sessions
      const { count: completedCount } = await supabase
        .from("patrol_assignments")
        .select("*", { count: "exact" })
        .eq("status", "completed")
        .gte("created_at", startOfDay);
      setCompletedSessions(completedCount || 0);
    } catch (err) {
      console.error("Error dashboard metrics:", err.message);
    }
  };
  
  // ✅ Metric cards
  const metrics = [
    {
      title: "Total Attendance Today",
      value: attendanceToday,
      icon: <Users className="text-blue-600 w-6 h-6" />,
    },
    {
      title: "Active Patrols",
      value: activePatrols,
      icon: <ShieldCheck className="text-green-600 w-6 h-6" />,
    },
    {
      title: "Total Incidents",
      value: incidentsToday,
      icon: <Bell className="text-purple-600 w-6 h-6" />,
    },
    {
      title: "Completed Sessions",
      value: completedSessions,
      icon: <ClipboardCheck className="text-emerald-600 w-6 h-6" />,
    },
  ];

  return (
    <AdminLayout_Clean>
      <div className="min-h-screen bg-gradient-to-br from-[#f7faff] via-white to-[#edf3ff] p-4 sm:p-10">

        {/* ✅ Header with only Incident Button */}
        <motion.div
          className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h1 className="text-4xl font-extrabold text-[#0B132B] mb-1">
              Admin Dashboard
            </h1>
            <p className="text-gray-500 text-sm">
              Monitor patrols and incidents in real-time.
            </p>
          </div>

          {/* 🔴 Incident Reports Button */}
          <Link
            to="/admin/incidents"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            <Bell className="w-5 h-5" />
            🚨 Incident Reports
          </Link>
        </motion.div>

        {/* ✅ Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {metrics.map((m, i) => (
            <motion.div
              key={i}
              className="p-4 rounded-2xl bg-white text-[#0B132B] border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-gray-500">{m.title}</p>
                {m.icon}
              </div>
              <h2 className="text-3xl font-bold">{m.value}</h2>
            </motion.div>
          ))}
        </div>

        {/* ✅ Map Section (unchanged) */}
        <MapRealtime />
        <div className="my-8"></div>

        {/* ✅ Route Assignment + Alerts (unchanged) */}
        <RouteAssignment />
        <RouteStatusAlert />

        <motion.div
          className="text-center mt-12 text-gray-400 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          © {new Date().getFullYear()} AHE SmartPatrol • Secure Patrol Management System
        </motion.div>
      </div>
    </AdminLayout_Clean>
  );
}
