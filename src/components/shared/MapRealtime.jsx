// ✅ AHE SmartPatrol v2.0 - Admin Live Map (Stable English Version)
// Smooth polyline, no shaking, blue guard pin, and auto flyTo.

import { useEffect, useRef } from "react";
import L from "leaflet";
import { motion } from "framer-motion";
import { getGuardChannel } from "../../lib/guardChannel";
import "leaflet/dist/leaflet.css";

// Fix broken icon path for Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function MapRealtime() {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const polylineRef = useRef(null);
  const routePoints = useRef([]);
  const lastUpdateRef = useRef(0);
  const channelRef = useRef(null);

  useEffect(() => {
    // 🗺️ Initialize map
    if (!mapRef.current) {
      mapRef.current = L.map("map-container").setView([5.648, 100.485], 15);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(mapRef.current);
      console.log("🗺️ Map initialized");
    }

    // 🛰️ Realtime subscription
    const channel = getGuardChannel().on(
      "broadcast",
      { event: "location_update" },
      (payload) => {
        const { lat, lng, name } = payload.payload || {};
        if (!lat || !lng || !mapRef.current) return;

        // Debounce updates (avoid vibration)
        const now = Date.now();
        if (now - lastUpdateRef.current < 1000) return;
        lastUpdateRef.current = now;

        // ✅ Create or update guard marker
        if (!markerRef.current) {
          const guardIcon = L.icon({
            iconUrl: "/images/guard-icon.png", // blue icon (ensure in /public/images/)
            iconSize: [38, 38],
            iconAnchor: [19, 38],
            popupAnchor: [0, -30],
          });
          markerRef.current = L.marker([lat, lng], { icon: guardIcon }).addTo(mapRef.current);
          markerRef.current.bindPopup(`<b>${name || "Guard Active"}</b><br/><small>Patrolling</small>`).openPopup();
          mapRef.current.flyTo([lat, lng], 17, { animate: true, duration: 1.2 });
          console.log("🛰️ Guard marker created");
        } else {
          markerRef.current.setLatLng([lat, lng]);
        }

        // ✅ Update polyline (single smooth line)
        routePoints.current.push([lat, lng]);
        if (!polylineRef.current) {
          polylineRef.current = L.polyline(routePoints.current, {
            color: "green",
            weight: 4,
            opacity: 0.8,
          }).addTo(mapRef.current);
        } else {
          polylineRef.current.setLatLngs(routePoints.current);
        }
      }
    );

    channelRef.current = channel;
    console.log("🛰️ Subscribed to guard_location channel");

    // 🧹 Cleanup
    return () => {
      console.log("🧹 Cleanup MapRealtime");
      try {
        if (mapRef.current) {
          mapRef.current.eachLayer((layer) => {
            if (layer instanceof L.Marker || layer instanceof L.Polyline) {
              mapRef.current.removeLayer(layer);
            }
          });
          mapRef.current.off();
          mapRef.current.remove();
          mapRef.current = null;
        }
        if (channelRef.current) {
          console.log("🧹 Channel detached (not destroyed)");
          channelRef.current = null;
        }
      } catch (err) {
        console.warn("⚠️ Cleanup error:", err.message);
      }
    };
  }, []);

  return (
    <motion.div
      className="rounded-2xl overflow-hidden border border-gray-200 shadow-md bg-white"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="flex items-baseline justify-between px-4 pt-4">
        <h3 className="text-lg font-semibold text-[#0B132B]">🗺️ Live Guard Tracking</h3>
        <p className="text-xs text-gray-500">Realtime updates</p>
      </div>
      <div className="h-[420px] w-full relative">
        <div id="map-container" className="h-full w-full z-0"></div>

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md border border-gray-200 rounded-xl shadow-md px-3 py-2 flex items-center gap-2 text-xs text-gray-700"
        >
          <div className="flex items-center gap-1">
            <span className="w-3 h-2 rounded-sm bg-green-500"></span>
            <span>Normal &lt;10km/h</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
