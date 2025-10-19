import { useAuth } from "../context/AuthContext";
import { useNavigate, Outlet, Link } from "react-router-dom";
import { Home, Map, AlertTriangle, Users, Settings } from "lucide-react";
import LogoutButton from "../components/shared/LogoutButton";
import { motion } from "framer-motion";
import ErrorBoundary from "../shared_v11/components/ErrorBoundary";

export default function AdminLayout_v11() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { path: "/v11-test/route", icon: <Home size={18} />, label: "Dashboard" },
    { path: "/v11-test/selfie", icon: <Map size={18} />, label: "Selfie" },
    { path: "/v11-test/incident", icon: <AlertTriangle size={18} />, label: "Incidents" },
    { path: "/v11-test/telegram", icon: <Users size={18} />, label: "Test" },
  ];

  return (
    <ErrorBoundary>
      <div className="flex min-h-screen bg-soft">
        {/* Sidebar */}
        <motion.aside
          className="w-64 bg-primary text-white flex flex-col"
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <motion.div
              className="px-6 py-4 text-2xl font-bold border-b border-white/10"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              AHE Admin v1.1
            </motion.div>
            <nav className="flex flex-col p-4 space-y-2">
              {navItems.map((item, index) => (
                <motion.div
                  key={item.path}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <Link
                    to={item.path}
                    className="flex items-center gap-2 p-2 rounded hover:bg-white/10 transition-colors"
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
          </div>

          {/* Sticky logout visible always */}
          <motion.div
            className="mt-auto p-4 border-t border-white/10 sticky bottom-0 bg-primary flex flex-col items-center gap-3"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <LogoutButton />
            <p className="text-xs text-white/70">
              {profile?.full_name || "Admin"}
            </p>
          </motion.div>
        </motion.aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <motion.header
            className="h-16 flex items-center justify-between px-8 bg-white shadow"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <h1 className="text-lg font-semibold text-primary">
              PRU Patrol Admin Panel v1.1
            </h1>
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">System Online</span>
            </div>
          </motion.header>
          
          <motion.main
            className="flex-1 p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Outlet />
          </motion.main>
        </div>
      </div>
    </ErrorBoundary>
  );
}
