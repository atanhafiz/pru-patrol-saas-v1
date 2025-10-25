import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AdminLayout from "../layouts/AdminLayout";
import GuardLayout from "../layouts/GuardLayout";
import AdminDashboard from "../pages/admin/Dashboard";
import AttendanceHistoryMap from "../pages/admin/AttendanceHistoryMap";
import AdminIncident from "../pages/admin/AdminIncident";
import GuardDashboard from "../pages/guard/Dashboard";
import RouteList from "../pages/guard/RouteList";
import SelfieCheckIn from "../pages/guard/SelfieCheckIn";
import IncidentForm from "../pages/guard/IncidentForm";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Landing from "../pages/Landing";

export default function AppRouter() {
  const { user, profile, loading } = useAuth();

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center text-lg text-primary">
        Loading...
      </div>
    );

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

{/* Admin (guna layout clean dari dalam Dashboard.jsx) */}
{user && profile?.role === "admin" && (
  <>
    <Route path="/admin" element={<AdminDashboard />} />
    <Route path="/admin/dashboard" element={<AdminDashboard />} />
    <Route path="/admin/attendance-history" element={<AttendanceHistoryMap />} />
    <Route path="/admin/attendance-map" element={<AttendanceHistoryMap />} />
    <Route path="/admin/incidents" element={<AdminIncident />} />
    <Route path="/admin/*" element={<Navigate to="/admin/dashboard" replace />} />
  </>
)}

      {/* Guard */}
      {user && profile?.role === "guard" && (
        <Route path="/guard" element={<GuardLayout />}>
          <Route index element={<GuardDashboard />} />
          <Route path="dashboard" element={<GuardDashboard />} />
          <Route path="routes" element={<RouteList />} />
          <Route path="selfie" element={<SelfieCheckIn />} />
          <Route path="report" element={<IncidentForm />} />
          <Route path="*" element={<Navigate to="/guard/dashboard" />} />
        </Route>
      )}

      <Route path="*" element={<Navigate to={user ? (profile?.role === "admin" ? "/admin/dashboard" : "/guard/dashboard") : "/login"} />} />
    </Routes>
  );
}
