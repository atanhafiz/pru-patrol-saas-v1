import { Link, useLocation } from "react-router-dom";
import { Camera, FileText, Clock } from "lucide-react";

export default function GuardBottomNav() {
  const location = useLocation();

  const navItems = [
    { label: "Selfie", icon: Camera, path: "/guard/route" },
    { label: "Report", icon: FileText, path: "/guard/report" },
    { label: "Timeline", icon: Clock, path: "/guard/timeline" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-2 z-50">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center text-xs ${
              active ? "text-blue-500" : "text-gray-500"
            }`}
          >
            <Icon className={`w-5 h-5 ${active ? "stroke-blue-500" : "stroke-gray-400"}`} />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
