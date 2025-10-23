import { useEffect, useRef } from "react";
import L from "leaflet";
import { motion } from "framer-motion";
import { supabase } from "../../lib/supabaseClient";
import { getGuardChannel } from "../../lib/guardChannel";
import "leaflet/dist/leaflet.css";

// Fix default marker icons for Vite/Netlify
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function MapRealtime({ isTrackingPaused = false }) {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const polylineRef = useRef(null);
  const routePoints = useRef([]);
  const channelRef = useRef(null);
  const lastUpdateRef = useRef(0);
  const lastLatLng = useRef(null);

  useEffect(() => {
    const mounted = { current: true };

    // Initialize map safely
    const initMap = () => {
      if (!mounted.current) return;
      const mapContainer = document.getElementById("map-container");
      if (!mapContainer) return;

      if (!mapRef.current) {
        mapRef.current = L.map("map-container").setView([5.648, 100.485], 15);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
        }).addTo(mapRef.current);
        console.log("🗺️ MAP initialized (static view)");
      }
    };

    setTimeout(initMap, 200);

    // Subscribe to guard_location
    if (channelRef.current) return;

    console.log("🛰️ Subscribing guard_location channel...");
    const channel = getGuardChannel().on(
      "broadcast",
      { event: "location_update" },
      (payload) => {
        const data = payload?.payload || payload; // ✅ fix payload double bug
        const { lat, lng, name } = data || {};
        if (!lat || !lng || !mapRef.current) return;

        const now = Date.now();
        if (now - lastUpdateRef.current < 1000) return; // debounce
        lastUpdateRef.current = now;

        // Calculate distance threshold (prevent micro jitter)
        if (lastLatLng.current) {
          const dx = lat - lastLatLng.current[0];
          const dy = lng - lastLatLng.current[1];
          const dist = Math.sqrt(dx * dx + dy * dy) * 111000; // meters
          if (dist < 5) return; // ignore <5m moves
        }
        lastLatLng.current = [lat, lng];

        // Marker update
        if (!markerRef.current) {
          const guardIcon = L.icon({
            iconUrl: "/images/guard-icon.png",
            iconSize: [40, 40],
            iconAnchor: [20, 40],
            popupAnchor: [0, -40],
          });
          markerRef.current = L.marker([lat, lng], { icon: guardIcon }).addTo(mapRef.current);
          markerRef.current.bindPopup(`<b>${name || "Guard Active"}</b>`);
          console.log("📍 Guard marker created");
        } else {
          markerRef.current.setLatLng([lat, lng]);
        }

        // Polyline update
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
    ).subscribe();

    channelRef.current = channel;

    return () => {
      mounted.current = false;
      console.log("🧹 Cleaning MapRealtime...");
      try {
        if (mapRef.current) {
          mapRef.current.off();
          mapRef.current.remove();
          mapRef.current = null;
        }
      } catch (err) {
        console.warn("⚠️ Map cleanup error:", err.message);
      }
      if (markerRef.current) markerRef.current = null;
      if (polylineRef.current) polylineRef.current = null;
      routePoints.current = [];
      console.log("🧹 Channel kept alive for realtime sync");
    };
  }, []);

  return (
    <motion.div
      className="rounded-2xl overflow-hidden border border-gray-200 shadow-md"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex justify-between px-4 pt-3">
        <h3 className="font-semibold text-[#0B132B]">🗺️ Live Guard Tracking</h3>
        <span className="text-xs text-gray-500">Static View</span>
      </div>
      <div className="h-[420px] w-full relative">
        <div id="map-container" className="h-full w-full z-0"></div>
      </div>
    </motion.div>
  );
}
