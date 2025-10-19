import { Outlet, useLocation, Link } from "react-router-dom";
import { Home, ListChecks, Camera, Clock3, FileText } from "lucide-react";
import LogoutButton from "../components/shared/LogoutButton";

export default function GuardLayout() {
  const location = useLocation();

  const navItems = [
    { path: "/guard/dashboard", icon: <Home size={20} />, label: "Home" },
    { path: "/guard/routes", icon: <ListChecks size={20} />, label: "Routes" },
    { path: "/guard/selfie", icon: <Camera size={20} />, label: "Selfie" },
    { path: "/guard/incident", icon: <FileText size={20} />, label: "Report" },
    { path: "/guard/timeline", icon: <Clock3 size={20} />, label: "Timeline" },
  ];

  return (
    <div className="relative min-h-screen flex flex-col bg-gray-100">
      {/* Logout Button */}
      <div className="fixed top-3 right-3 z-[99999]">
        <LogoutButton />
      </div>

      {/* Main Content */}
      <div
        className="flex-1 overflow-y-auto"
        style={{
          paddingBottom: "90px", // supaya tak overlap dengan navbar
        }}
      >
        <Outlet />
      </div>

      {/* Bottom Navigation */}
      <nav role="navigation" className="fixed bottom-0 left-0 w-full bg-white z-[9999] shadow flex justify-around py-3 backdrop-blur-md border-t border-gray-200">
  {navItems.map((item) => {
    const active = location.pathname === item.path;
    return (
      <Link
        key={item.path}
        to={item.path}
        className={`flex flex-col items-center text-xs font-medium transition ${
          active ? "text-accent" : "text-gray-400 hover:text-accent"
        }`}
      >
        <div className="mb-1">{item.icon}</div>
        {item.label}
      </Link>
    );
  })}
</nav>
    </div>
  );
}
