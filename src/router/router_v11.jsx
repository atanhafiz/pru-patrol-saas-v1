import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import RouteList_v11 from "../guard_v11/RouteList_v11.jsx";
import SelfieCheckIn_v11 from "../guard_v11/SelfieCheckIn_v11.jsx";
import IncidentForm_v11 from "../guard_v11/IncidentForm_v11.jsx";
import TelegramTest_v11 from "../guard_v11/TelegramTest_v11.jsx";

export default function RouterV11() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-primary text-white p-4 shadow-md">
          <h1 className="text-2xl font-bold text-center">
            PRU Patrol v1.1 Sandbox
          </h1>
          <p className="text-center text-sm opacity-90 mt-1">
            Testing Environment - Components isolated for v1.1 testing
          </p>
        </div>
        
        <div className="p-6">
          <Routes>
            <Route path="/v11-test/route" element={<RouteList_v11 />} />
            <Route path="/v11-test/selfie" element={<SelfieCheckIn_v11 />} />
            <Route path="/v11-test/incident" element={<IncidentForm_v11 />} />
            <Route path="/v11-test/telegram" element={<TelegramTest_v11 />} />
            <Route path="*" element={<Navigate to="/v11-test/route" replace />} />

          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
