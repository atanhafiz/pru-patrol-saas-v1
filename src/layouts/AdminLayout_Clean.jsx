// AdminLayout_Clean.jsx — AHE SmartPatrol Minimal Admin Dashboard Layout
import { useState, useEffect, useRef } from "react";
import { Bell, Settings, LogOut, Map, AlertTriangle, Menu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import AdminAlertCenter from "../components/admin/AdminAlertCenter";
import { supabase } from "../lib/supabaseClient";

export default function AdminLayout_Clean({ children }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(3); // sementara dummy
  const alertRef = useRef(null);
  const prevAlertCountRef = useRef(0);

  // Fetch alert count from Supabase
  const fetchAlertCount = async () => {
    try {
      const { count } = await supabase
        .from('incidents')
        .select('*', { count: 'exact' })
        .eq('status', 'active');
      setAlertCount(count || 0);
    } catch (error) {
      console.error('Error fetching alert count:', error);
    }
  };

  // Handle clicks outside Alert Center
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (alertOpen && alertRef.current && !alertRef.current.contains(event.target)) {
        setAlertOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [alertOpen]);

  // Listen to realtime changes in incidents table
  useEffect(() => {
    // Fetch initial count on mount
    fetchAlertCount();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('incidents-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'incidents',
          filter: 'status=eq.active'
        },
        (payload) => {
          console.log('Incident change detected:', payload);
          fetchAlertCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Play notification sound when alertCount increases
  useEffect(() => {
    if (alertCount > prevAlertCountRef.current && prevAlertCountRef.current > 0) {
      const audio = document.getElementById('alertSound');
      if (audio) {
        audio.play().catch(error => {
          console.log('Audio play failed:', error);
        });
      }
    }
    prevAlertCountRef.current = alertCount;
  }, [alertCount]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7faff] via-white to-[#edf3ff] text-gray-800 relative overflow-x-hidden">
      {/* Hidden audio element for notifications */}
      <audio id="alertSound" src="/sounds/pling.mp3" preload="auto" />
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

{/* ⚡ Floating Quick Actions */}
<div className="fixed bottom-5 right-5 flex flex-col gap-3 sm:gap-4 z-[9999]">
  {/* 🗺️ Map Button */}
  <button
    onClick={() => {
      const mapSection = document.querySelector("#map-section");
      if (mapSection) {
        mapSection.scrollIntoView({ behavior: "smooth" });
      }
    }}
    title="Scroll to Live Map"
    className="relative bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-transform active:scale-95"
  >
    <Map className="w-5 h-5" />
  </button>

  {/* ⚠️ Alert Button */}
  <button
    onClick={() => setAlertOpen(!alertOpen)}
    title="Toggle Alert Center"
    className={`relative ${
      alertOpen
        ? "bg-amber-600 ring-4 ring-amber-300/40"
        : "bg-amber-500 hover:bg-amber-600"
    } text-white p-3 rounded-full shadow-lg transition-transform active:scale-95`}
  >
    <AlertTriangle className="w-5 h-5" />
    {/* 🔴 Badge Merah */}
    {alertCount > 0 && (
      <motion.span
        key={alertCount}
        initial={{ scale: 0.8, opacity: 0.7 }}
        animate={{ scale: 1.2, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 10, duration: 0.2 }}
        className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-md"
      >
        {alertCount}
      </motion.span>
    )}
  </button>
</div>

{/* 📢 Alert Center Panel */}
<motion.div
  ref={alertRef}
  initial={{ opacity: 0, y: 20 }}
  animate={alertOpen ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
  transition={{ duration: 0.3 }}
  className={`fixed bottom-[110px] right-[90px] sm:right-[100px] z-[9998] ${
    alertOpen ? "pointer-events-auto" : "pointer-events-none"
  }`}
>
  {alertOpen && (
    <div className="shadow-xl rounded-xl overflow-hidden">
      <AdminAlertCenter />
    </div>
  )}
</motion.div>

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
