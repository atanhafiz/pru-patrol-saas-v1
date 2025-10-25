// router.jsx — AHE SmartPatrol GuardApp FINAL (no redirect logic)

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Guard pages
import RouteList from "./pages/guard/RouteList";
import ReportPage from "./pages/guard/ReportPage";
import SelfiePage from "./pages/guard/SelfiePage";

// Admin + Auth
import Dashboard from "./pages/admin/Dashboard";
import Login from "./pages/guard/Login";
import Register from "./pages/guard/Register";

export default function AppRouter() {
  return (
    <Router>
      <Routes>
        {/* Default → terus ke guard routes */}
        <Route path="/" element={<Navigate to="/guard/routes" replace />} />

        {/* 🔒 FORCE kekal di route — tak depend registered */}
        <Route path="/guard/routes" element={<RouteList />} />
        <Route path="/guard/report" element={<ReportPage />} />
        <Route path="/guard/selfie" element={<SelfiePage />} />

        {/* Admin */}
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/guard/login" element={<Login />} />
        <Route path="/guard/register" element={<Register />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/guard/routes" replace />} />
      </Routes>
    </Router>
  );
}
