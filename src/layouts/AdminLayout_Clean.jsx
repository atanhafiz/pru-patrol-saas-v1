// AdminLayout_Clean.jsx — AHE SmartPatrol Minimal Admin Dashboard Layout
import { useState } from "react";
import { LogOut, Menu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function AdminLayout_Clean({ children }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7faff] via-white to-[#edf3ff] text-gray-800 relative overflow-x-hidden">
      {/* 🧭 Top Navigation Bar */}
      <header className="flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMenuOpen(true)}
            className="sm:hidden p-2 rounded hover:bg-gray-100"
          >
            <Menu className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="font-bold text-lg text-[#1e3a8a]">AHE SmartPatrol</h1>
          <span className="text-sm text-gray-400 hidden sm:inline">
          </span>
        </div>

        <div className="flex items-center gap-3">
  <button
    onClick={async () => {
      await supabase.auth.signOut();
      localStorage.clear();
      navigate("/login", { replace: true });
    }}
    className="flex items-center gap-1 bg-red-500 text-white px-3 py-1.5 rounded-md hover:bg-red-600 transition"
  >
    <LogOut className="w-4 h-4" />
    <span className="text-sm">Logout</span>
  </button>
</div>
      </header>

      {/* 🧩 Main content */}
      <main className="p-4 pb-20">{children}</main>

      {/* 📱 Mobile Menu Drawer */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="fixed top-0 left-0 w-56 h-full bg-[#1e3a8a] text-white z-[9999] flex flex-col shadow-lg"
          >
            <div className="flex justify-between items-center px-4 py-3 border-b border-blue-900">
              <h2 className="font-semibold text-lg">Menu</h2>
              <button
                onClick={() => setMenuOpen(false)}
                className="text-gray-300 hover:text-white"
              >
                ✕
              </button>
            </div>

            <nav className="flex flex-col p-3 space-y-2 text-sm">
              <a
                href="/admin/dashboard"
                onClick={() => setMenuOpen(false)}
                className="hover:bg-blue-700 rounded px-3 py-2"
              >
                Dashboard
              </a>
              <a
                href="/admin/reports"
                onClick={() => setMenuOpen(false)}
                className="hover:bg-blue-700 rounded px-3 py-2"
              >
                Reports
              </a>
              <a
                href="/admin/guards"
                onClick={() => setMenuOpen(false)}
                className="hover:bg-blue-700 rounded px-3 py-2"
              >
                Guards
              </a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
