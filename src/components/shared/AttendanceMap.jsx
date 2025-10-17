import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { motion } from "framer-motion";
import { supabase } from "../../lib/supabaseClient";
import "leaflet/dist/leaflet.css";

const pinIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/447/447031.png",
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -30],
});

export default function AttendanceMap() {
  const [records, setRecords] = useState([]);

  const fetchData = async () => {
    const { data, error } = await supabase
      .from("attendance")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setRecords(data);
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel("attendance_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "attendance" },
        (payload) => setRecords((prev) => [payload.new, ...prev])
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  return (
    <motion.div
      className="bg-white rounded-2xl shadow-md p-6 mt-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <h2 className="text-2xl font-semibold text-primary mb-4">
        🗺️ Attendance History Map
      </h2>

      {records.length === 0 ? (
        <p className="text-gray-400 italic">No attendance records yet.</p>
      ) : (
        <div className="rounded-2xl overflow-hidden border border-gray-100 shadow">
          <MapContainer
            center={[records[0].lat, records[0].lng]}
            zoom={15}
            scrollWheelZoom
            className="h-[600px] w-full z-0"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="© OpenStreetMap contributors"
            />

            {records.map((r, i) => (
              <Marker
                key={r.id}
                position={[r.lat, r.lng]}
                icon={pinIcon}
                riseOnHover
              >
                <Popup>
                  <div className="text-center">
                    <img
                      src={r.photo_url}
                      alt="Selfie"
                      className="rounded-xl shadow mb-2 max-h-40 object-cover"
                    />
                    <p className="text-sm text-primary font-semibold">
                      {new Date(r.created_at).toLocaleString()}
                    </p>
                    <p className="text-gray-500 text-xs">
                      Lat: {r.lat.toFixed(5)} | Lng: {r.lng.toFixed(5)}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}
    </motion.div>
  );
}
