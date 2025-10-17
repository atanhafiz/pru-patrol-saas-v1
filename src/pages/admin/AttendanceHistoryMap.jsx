import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { supabase } from "../../lib/supabaseClient";

export default function AttendanceHistoryMap() {
  const [sessions, setSessions] = useState([]);
  const [center, setCenter] = useState([5.5956, 100.5626]); // default PRIMA Residensi Utama
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const { data, error } = await supabase
        .from("guard_sessions")
        .select("*")
        .order("start_time", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error fetching sessions:", error.message);
        return;
      }

      if (data && data.length) {
        setSessions(data);
        const first = data[0];
        if (first.start_lat && first.start_lng) {
          setCenter([first.start_lat, first.start_lng]);
        }
      }
    } catch (err) {
      console.error("loadSessions error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-lg text-primary">Loading attendance history...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
        📍 Attendance History Map
      </h2>

      <div className="h-[600px] w-full rounded-xl overflow-hidden shadow-md">
        <MapContainer
          center={center}
          zoom={15}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />

          {/* Marker Selfie IN */}
          {sessions.map((s) => (
            s.start_lat && s.start_lng && (
              <Marker key={`${s.id}-in`} position={[s.start_lat, s.start_lng]}>
                <Popup>
                  <div className="text-sm">
                    <p><strong>🟢 Selfie IN</strong></p>
                    <p><strong>Guard:</strong> {s.guard_name}</p>
                    <p><strong>Plate:</strong> {s.plate_no}</p>
                    <p><strong>Time:</strong> {new Date(s.start_time).toLocaleString()}</p>
                    {s.selfie_in_url && (
                      <img
                        src={s.selfie_in_url}
                        alt="Selfie In"
                        className="w-40 mt-2 rounded-md border"
                      />
                    )}
                  </div>
                </Popup>
              </Marker>
            )
          ))}

          {/* Marker Selfie OUT */}
          {sessions.map((s) => (
            s.end_lat && s.end_lng && (
              <Marker key={`${s.id}-out`} position={[s.end_lat, s.end_lng]}>
                <Popup>
                  <div className="text-sm">
                    <p><strong>🔴 Selfie OUT</strong></p>
                    <p><strong>Guard:</strong> {s.guard_name}</p>
                    <p><strong>Plate:</strong> {s.plate_no}</p>
                    <p><strong>Time:</strong> {new Date(s.end_time).toLocaleString()}</p>
                    {s.selfie_out_url && (
                      <img
                        src={s.selfie_out_url}
                        alt="Selfie Out"
                        className="w-40 mt-2 rounded-md border"
                      />
                    )}
                  </div>
                </Popup>
              </Marker>
            )
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
