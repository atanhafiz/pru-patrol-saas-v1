import { motion } from "framer-motion";
import { LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function LogoutButton() {
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/login"; // force redirect ke login
  };

  return (
    <motion.button
      onClick={handleLogout}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg shadow hover:shadow-lg transition-all"
    >
      <LogOut className="w-5 h-5" />
      <span className="font-medium text-sm">Logout</span>
    </motion.button>
  );
}
