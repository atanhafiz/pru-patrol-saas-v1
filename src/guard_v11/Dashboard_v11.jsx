import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../lib/supabaseClient";
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
import LoadingSpinner from "../shared_v11/components/LoadingSpinner";
import ErrorBoundary from "../shared_v11/components/ErrorBoundary";
import { useRealtime } from "../shared_v11/hooks/useRealtime";

export default function GuardDashboard_v11() {
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [incidents, setIncidents] = useState(0);
  const [lastCheck, setLastCheck] = useState(null);
  const [chartData, setChartData] = useState([]);

  // Use realtime hook for attendance data
  const { data: attendanceData, loading: attendanceLoading } = useRealtime('attendance_log', {
    select: "*",
    order: { created_at: "desc" }
  });

  const fetchData = async () => {
    try {
      // Fetch attendance data from attendance_log table
      const { data: attendanceData, error: attendanceError } = await supabase
        .from("attendance_log")
        .select("*")
        .order("created_at", { ascending: false });

      if (attendanceError) {
        console.error("Error fetching attendance data:", attendanceError);
        return;
      }

      // Fetch incidents count
      const { count: incCount } = await supabase
        .from("incidents")
        .select("*", { count: "exact" });

      if (attendanceData && attendanceData.length > 0) {
        // Calculate attendance count for last 7 days (all guards)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentAttendance = attendanceData.filter(
          (d) => new Date(d.created_at) >= sevenDaysAgo
        );
        setAttendanceCount(recentAttendance.length);

        // Set last check-in data (most recent from any guard)
        setLastCheck(attendanceData[0]);

        // Build 7-day attendance history (aggregate of all guards)
        const dailyData = {};
        attendanceData.forEach((d) => {
          const day = new Date(d.created_at).toLocaleDateString();
          dailyData[day] = (dailyData[day] || 0) + 1;
        });
        
        const chartData = Object.entries(dailyData)
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .slice(-7); // last 7 days
        
        setChartData(chartData);
      } else {
        setAttendanceCount(0);
        setLastCheck(null);
        setChartData([]);
      }

      setIncidents(incCount || 0);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update data when realtime attendance data changes
  useEffect(() => {
    if (attendanceData) {
      // Calculate attendance count for last 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentAttendance = attendanceData.filter(
        (d) => new Date(d.created_at) >= sevenDaysAgo
      );
      setAttendanceCount(recentAttendance.length);

      // Set last check-in data
      if (attendanceData.length > 0) {
        setLastCheck(attendanceData[0]);
      }

      // Build 7-day attendance history
      const dailyData = {};
      attendanceData.forEach((d) => {
        const day = new Date(d.created_at).toLocaleDateString();
        dailyData[day] = (dailyData[day] || 0) + 1;
      });
      
      const chartData = Object.entries(dailyData)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(-7);
      
      setChartData(chartData);
    }
  }, [attendanceData]);

  const cards = [
    {
      title: "Total Attendance (7 Days)",
      value: attendanceCount,
      icon: <Camera className="w-6 h-6 text-accent" />,
      color: "from-blue-500 to-cyan-400",
    },
    {
      title: "Incidents Reported",
      value: incidents,
      icon: <Activity className="w-6 h-6 text-yellow-400" />,
      color: "from-yellow-400 to-orange-400",
    },
  ];

  if (attendanceLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-soft p-6">
        <motion.h1
          className="text-3xl font-bold text-primary mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Guard Dashboard v1.1
        </motion.h1>

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
                GPS: {lastCheck.lat?.toFixed(5)}, {lastCheck.long?.toFixed(5)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Guard: {lastCheck.guard_name}
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
              Total Attendance History (7 Days)
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
    </ErrorBoundary>
  );
}
