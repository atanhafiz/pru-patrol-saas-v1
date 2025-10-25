// router.jsx — AHE SmartPatrol GuardApp CLEAN VERSION (Patched Anti-Redirect)

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// ✅ Import Guard Pages (current)
import RouteList from "./pages/guard/RouteList";
import ReportPage from "./pages/guard/ReportPage";
import SelfiePage from "./pages/guard/SelfiePage";

// ✅ (Optional) Admin pages — kalau nak guna semula nanti
import Dashboard from "./pages/admin/Dashboard";
import Login from "./pages/guard/Login";
import Register from "./pages/guard/Register";

export default function AppRouter() {
  return (
    <Router>
      <Routes>

        {/* Default guard page → terus ke Routes */}
        <Route path="/" element={<Navigate to="/guard/routes" replace />} />

        {/* ✅ Guard Pages — kekalkan dalam RouteList walaupun reload */}
        <Route
          path="/guard/routes"
          element={<PersistentGuardRoute component={<RouteList />} />}
        />
        <Route path="/guard/report" element={<ReportPage />} />
        <Route path="/guard/selfie" element={<SelfiePage />} />

        {/* Admin Pages */}
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/guard/login" element={<Login />} />
        <Route path="/guard/register" element={<Register />} />

        {/* Fallback (anything else → routes) */}
        <Route path="*" element={<Navigate to="/guard/routes" replace />} />
      </Routes>
    </Router>
  );
}

/* ✅ Mini wrapper: kekalkan guard di RouteList walau registered hilang sementara */
function PersistentGuardRoute({ component }) {
  const registered =
    localStorage.getItem("registered") === "true" ||
    sessionStorage.getItem("registered") === "true";

  // Kalau guard belum register langsung, baru redirect ke login
  if (!registered) {
    return <Navigate to="/guard/login" replace />;
  }

  // Selain tu, kekalkan page (no redirect ke dashboard)
  return component;
}
