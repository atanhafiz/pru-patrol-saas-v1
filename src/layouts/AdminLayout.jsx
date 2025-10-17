import { useAuth } from "../context/AuthContext";
import { useNavigate, Outlet, Link } from "react-router-dom";
import { Home, Users, Map, FileText } from "lucide-react";
import LogoutButton from "../components/shared/LogoutButton";

export default function AdminLayout() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-soft">
      {/* Sidebar */}
      <aside className="w-64 bg-primary text-white flex flex-col">
        <div>
          <div className="px-6 py-4 text-2xl font-bold border-b border-white/10">
            AHE Admin
          </div>
          <nav className="flex flex-col p-4 space-y-2">
            <Link to="/admin/dashboard" className="flex items-center gap-2 p-2 rounded hover:bg-white/10">
              <Home size={18} /> Dashboard
            </Link>
            <Link to="/admin/guards" className="flex items-center gap-2 p-2 rounded hover:bg-white/10">
              <Users size={18} /> Guards
            </Link>
            <Link to="/admin/houses" className="flex items-center gap-2 p-2 rounded hover:bg-white/10">
              <Map size={18} /> Houses
            </Link>
            <Link to="/admin/reports" className="flex items-center gap-2 p-2 rounded hover:bg-white/10">
              <FileText size={18} /> Reports
            </Link>
          </nav>
        </div>

        {/* Sticky logout visible always */}
        <div className="mt-auto p-4 border-t border-white/10 sticky bottom-0 bg-primary flex flex-col items-center gap-3">
          <LogoutButton /> {/* 🔥 Butang logout premium */}
          <p className="text-xs text-white/70">
            {profile?.full_name || "Admin"}
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 flex items-center justify-between px-8 bg-white shadow">
          <h1 className="text-lg font-semibold text-primary">
            PRU Patrol Admin Panel
          </h1>
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
