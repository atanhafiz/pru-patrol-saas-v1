// ✅ Fixed: Admin map pin, flyTo stabil, guard-icon betul

import { useEffect, useRef } from "react";
import L from "leaflet";
import { motion } from "framer-motion";
import { getGuardChannel } from "../../lib/guardChannel";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/images/guard-icon.jpg",
  iconUrl: "/images/guard-icon.jpg",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function MapRealtime() {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const polylineRef = useRef(null);
  const routePoints = useRef([]);
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    mapRef.current = L.map("map-container").setView([5.65, 100.5], 15);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap" }).addTo(mapRef.current);

    const channel = getGuardChannel().on("broadcast", { event: "location_update" }, (payload) => {
      const { lat, lng, name } = payload.payload || {};
      if (!lat || !lng) return;

      const now = Date.now();
      if (now - lastUpdateRef.current < 800) return;
      lastUpdateRef.current = now;

      if (!markerRef.current) {
        const icon = L.icon({ iconUrl: "/images/guard-icon.jpg", iconSize: [40, 40], iconAnchor: [20, 40] });
        markerRef.current = L.marker([lat, lng], { icon }).addTo(mapRef.current);
        markerRef.current.bindPopup(`<b>${name}</b><br/>Patrolling`).openPopup();
        mapRef.current.flyTo([lat, lng], 17, { animate: true, duration: 1.3 });
      } else markerRef.current.setLatLng([lat, lng]);

      routePoints.current.push([lat, lng]);
      if (!polylineRef.current)
        polylineRef.current = L.polyline(routePoints.current, { color: "green", weight: 4 }).addTo(mapRef.current);
      else polylineRef.current.setLatLngs(routePoints.current);
    });

    return () => {
      mapRef.current.remove();
      polylineRef.current = null;
      markerRef.current = null;
    };
  }, []);

  return (
    <motion.div
      className="rounded-2xl overflow-hidden border border-gray-200 shadow bg-white"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="flex justify-between px-4 pt-4">
        <h3 className="text-lg font-semibold">🗺️ Live Guard Tracking</h3>
        <p className="text-xs text-gray-500">Live updates</p>
      </div>
      <div id="map-container" className="h-[420px] w-full"></div>
    </motion.div>
  );
}