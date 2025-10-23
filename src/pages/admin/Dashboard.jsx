// ✅ AHE SmartPatrol Admin Dashboard (Clean + Stable)
// Auto metrics + MapRealtime + RouteAssignment

import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { sendTelegramPhoto } from "../../lib/telegram";
import { Bell, ShieldCheck, ClipboardCheck, Users } from "lucide-react";
import MapRealtime from "../../components/shared/MapRealtime";
import RouteAssignment from "../../components/admin/RouteAssignment";
import RouteStatusAlert from "../../components/admin/RouteStatusAlert";
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

      const { count: patrolCount } = await supabase
        .from("patrol_assignments")
        .select("*", { count: "exact" })
        .eq("status", "pending");
      setActivePatrols(patrolCount || 0);

      // incidents.status mungkin tak wujud — selamatkan query
      const { count: reportsCount } = await supabase
        .from("incidents")
        .select("*", { count: "exact" })
        .gte("created_at", startOfDay);
      setPendingReports(reportsCount || 0);
      setIncidentsToday(reportsCount || 0);
    } catch (err) {
      console.error("Error dashboard metrics:", err.message);
    }
  };

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
      title: "Reports Logged Today",
      value: pendingReports,
      icon: <ClipboardCheck className="text-yellow-400 w-6 h-6" />,
      gradient: "from-yellow-400 to-orange-400",
    },
    {
      title: "Total Incidents",
      value: incidentsToday,
      icon: <Bell className="text-purple-400 w-6 h-6" />,
      gradient: "from-purple-500 to-pink-400",
    },
  ];

  return (
    <AdminLayout_Clean>
      <div className="min-h-screen bg-gradient-to-br from-[#f7faff] via-white to-[#edf3ff] p-4 sm:p-10">
        <motion.div
          className="bg-gradient-to-br from-white to-[#f5f9ff] border border-gray-100 rounded-2xl shadow-sm p-6 mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-extrabold text-[#0B132B] mb-1">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm">Monitor rondaan & insiden secara langsung.</p>
        </motion.div>

        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {metrics.map((m, i) => (
            <motion.div
              key={i}
              className={`p-4 rounded-2xl bg-gradient-to-br ${m.gradient} text-white shadow-md`}
              whileHover={{ scale: 1.03 }}
            >
              <div className="flex justify-between items-center mb-2">
                <p>{m.title}</p>
                {m.icon}
              </div>
              <h2 className="text-3xl font-bold">{m.value}</h2>
            </motion.div>
          ))}
        </div>

        <MapRealtime />
        <div className="my-8"></div>
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
