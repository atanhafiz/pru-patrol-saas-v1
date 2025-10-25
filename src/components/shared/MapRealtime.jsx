// ✅ AHE SmartPatrol Admin Live Map v2.1 (Multi-Guard Stable)
// Real-time multi-guard tracking + smooth polyline per guard
// Works seamlessly with guardChannel.js broadcast

import { useEffect, useRef } from "react";
import L from "leaflet";
import { motion } from "framer-motion";
import { getGuardChannel } from "../../lib/guardChannel";
import "leaflet/dist/leaflet.css";

// 🧩 Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function MapRealtime() {
  const mapRef = useRef(null);
  const guardMarkersRef = useRef({}); // { guardName: marker }
  const guardPathsRef = useRef({}); // { guardName: polyline }
  const routePointsRef = useRef({}); // { guardName: [[lat,lng], ...] }
  const flyToOnce = useRef(new Set());
  const channelRef = useRef(null);
  const lastUpdateRef = useRef({}); // throttle per guard

  useEffect(() => {
    // 🗺️ Initialize Map
    if (!mapRef.current) {
      mapRef.current = L.map("map-container").setView([5.648, 100.485], 15);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(mapRef.current);
      console.log("🗺️ Map initialized");
    }

    // 🛰️ Subscribe to realtime guard channel
    const channel = getGuardChannel().on(
      "broadcast",
      { event: "location_update" },
      (payload) => {
        const { lat, lng, name, status } = payload.payload || {};
        if (!lat || !lng || !name || !mapRef.current) return;

        const now = Date.now();
        const last = lastUpdateRef.current[name] || 0;
        if (now - last < 1500) return; // throttle 1.5s
        lastUpdateRef.current[name] = now;

        // ✅ Create route buffer if not exists
        if (!routePointsRef.current[name]) routePointsRef.current[name] = [];

        const points = routePointsRef.current[name];
        const lastPoint = points.at(-1);

        // 🧭 Skip drift <3m
        if (
          lastPoint &&
          Math.abs(lat - lastPoint[0]) < 0.00003 &&
          Math.abs(lng - lastPoint[1]) < 0.00003
        )
          return;

        points.push([lat, lng]);

        // ✅ Create / update marker
        if (!guardMarkersRef.current[name]) {
          const guardIcon = L.icon({
            iconUrl: "/images/guard-icon.png", // put in public/images
            iconSize: [38, 38],
            iconAnchor: [19, 38],
            popupAnchor: [0, -30],
          });
          const marker = L.marker([lat, lng], { icon: guardIcon }).addTo(mapRef.current);
          marker.bindPopup(
            `<b>${name}</b><br/><small>${status || "Patrolling"}</small>`
          );
          guardMarkersRef.current[name] = marker;
          console.log(`🛰️ Marker created for ${name}`);

          // FlyTo first time only
          if (!flyToOnce.current.has(name)) {
            mapRef.current.flyTo([lat, lng], 17, { animate: true, duration: 1.2 });
            flyToOnce.current.add(name);
          }
        } else {
          guardMarkersRef.current[name].setLatLng([lat, lng]);
        }

        // ✅ Update polyline per guard
        if (!guardPathsRef.current[name]) {
          guardPathsRef.current[name] = L.polyline(points, {
            color: "#00b300",
            weight: 4,
            opacity: 0.8,
            smoothFactor: 1,
          }).addTo(mapRef.current);
        } else {
          guardPathsRef.current[name].setLatLngs(points);
        }
      }
    );

    channelRef.current = channel;
    console.log("🛰️ Subscribed to guard_location channel");

    // 🧹 Cleanup
    return () => {
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
        channelRef.current = null;
        console.log("🧹 Cleaned up MapRealtime");
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
        <h3 className="text-lg font-semibold text-[#0B132B]">🗺️ Live Multi-Guard Tracking</h3>
        <p className="text-xs text-gray-500">Realtime updates via Supabase</p>
      </div>

      <div className="h-[420px] w-full relative">
        <div id="map-container" className="h-full w-full z-0"></div>

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md border border-gray-200 rounded-xl shadow-md px-3 py-2 flex items-center gap-3 text-xs text-gray-700"
        >
          <div className="flex items-center gap-1">
            <span className="w-3 h-2 rounded-sm bg-green-500"></span>
            <span>Active Guards</span>
          </div>
          <div className="flex items-center gap-1">
            <img src="/images/guard-icon.png" alt="Guard" className="w-4 h-4" />
            <span>Guard Position</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
