import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { motion } from "framer-motion";
import { supabase } from "../../lib/supabaseClient";
import "leaflet/dist/leaflet.css";

const guardIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/3061/3061285.png",
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -30],
});

export default function MapRealtime() {
  const [guards, setGuards] = useState([
    { id: 1, name: "Amir", lat: 5.648, lng: 100.486, status: "Patrolling" },
    { id: 2, name: "Danial", lat: 5.646, lng: 100.482, status: "On Standby" },
  ]);

  useEffect(() => {
    const channel = supabase
      .channel("guard_location")
      .on("broadcast", { event: "location_update" }, ({ payload }) => {
        setGuards((prev) =>
          prev.map((g) =>
            g.id === payload.id
              ? { ...g, lat: payload.lat, lng: payload.lng }
              : g
          )
        );
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <motion.div
      className="rounded-2xl shadow-xl overflow-hidden border border-gray-100"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="h-[600px] w-full">
        <MapContainer
          center={[5.648, 100.485]}
          zoom={15}
          scrollWheelZoom={true}
          className="h-full w-full z-0"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="© OpenStreetMap"
          />
          {guards.map((guard) => (
            <Marker
              key={guard.id}
              position={[guard.lat, guard.lng]}
              icon={guardIcon}
            >
              <Popup>
                <div className="text-center">
                  <h2 className="font-bold text-primary">{guard.name}</h2>
                  <p className="text-sm">{guard.status}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </motion.div>
  );
}
