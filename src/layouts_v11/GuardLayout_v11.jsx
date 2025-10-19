import { Outlet, useLocation, Link } from "react-router-dom";
import { Home, ListChecks, Camera, Clock3, FileText } from "lucide-react";
import LogoutButton from "../components/shared/LogoutButton";
import { motion } from "framer-motion";
import ErrorBoundary from "../shared_v11/components/ErrorBoundary";

export default function GuardLayout_v11() {
  const location = useLocation();

  const navItems = [
    { path: "/guard/dashboard", icon: <Home size={20} />, label: "Home" },
    { path: "/guard/routes", icon: <ListChecks size={20} />, label: "Routes" },
    { path: "/guard/selfie", icon: <Camera size={20} />, label: "Selfie" },
    { path: "/guard/incident", icon: <FileText size={20} />, label: "Report" },
    { path: "/guard/timeline", icon: <Clock3 size={20} />, label: "Timeline" },
  ];

  return (
    <ErrorBoundary>
      <div className="relative min-h-screen flex flex-col bg-gray-100">
        {/* Logout Button */}
        <motion.div
          className="fixed top-3 right-3 z-[99999]"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
        >
          <LogoutButton />
        </motion.div>

        {/* Main Content */}
        <motion.div
          className="flex-1 overflow-y-auto"
          style={{
            paddingBottom: "90px", // supaya tak overlap dengan navbar
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Outlet />
        </motion.div>

        {/* Bottom Navigation */}
        <motion.nav
          role="navigation"
          className="fixed bottom-0 left-0 w-full bg-white z-[9999] shadow flex justify-around py-3 backdrop-blur-md border-t border-gray-200"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
        >
          {navItems.map((item, index) => {
            const active = location.pathname === item.path;
            return (
              <motion.div
                key={item.path}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 + index * 0.1 }}
              >
                <Link
                  to={item.path}
                  className={`flex flex-col items-center text-xs font-medium transition ${
                    active ? "text-accent" : "text-gray-400 hover:text-accent"
                  }`}
                >
                  <motion.div
                    className="mb-1"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {item.icon}
                  </motion.div>
                  {item.label}
                  {active && (
                    <motion.div
                      className="w-1 h-1 bg-accent rounded-full mt-1"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200 }}
                    />
                  )}
                </Link>
              </motion.div>
            );
          })}
        </motion.nav>
      </div>
    </ErrorBoundary>
  );
}
