import { Link, useLocation } from "react-router-dom";
import { Camera, FileText, Clock, Map } from "lucide-react";

export default function GuardBottomNav() {
  const location = useLocation();

  const navItems = [
    { label: "Routes", icon: Map, path: "/guard/routes" }, // ✅ added
    { label: "Attendance", icon: Camera, path: "/guard/selfie" },
    { label: "Report", icon: FileText, path: "/guard/report" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-100 flex justify-around py-2 z-50 shadow-sm">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = location.pathname === item.path;

        return (
          <Link
            key={item.path}
            to={item.path}
            className="flex flex-col items-center text-xs relative w-1/3"
          >
            {/* highlight bar atas icon */}
            <div
              className={`absolute top-0 left-0 right-0 h-[3px] rounded-b-full transition-all duration-300 ${
                active ? "bg-blue-600" : "bg-transparent"
              }`}
            ></div>

            <Icon
              className={`w-5 h-5 mb-0.5 transition-all ${
                active ? "stroke-blue-600 scale-110" : "stroke-gray-400"
              }`}
            />
            <span
              className={`text-[11px] font-medium ${
                active ? "text-blue-600" : "text-gray-500"
              }`}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
