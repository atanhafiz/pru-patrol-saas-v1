import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { motion } from "framer-motion";
import { supabase } from "../../lib/supabaseClient";
import "leaflet/dist/leaflet.css";

// Fix broken default marker paths in Netlify/Vite
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function MapRealtime({ isTrackingPaused = false }) {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const polylineRef = useRef(null);
  const routePoints = useRef([]);
  const channelRef = useRef(null);
  const [guards, setGuards] = useState([]);
  const markersRef = useRef(new Map()); // Store multiple markers by guard ID
  const prevPositionRef = useRef(null); // Store previous position for speed calculation
  const mountedRef = useRef(true); // Prevent operations on unmounted component

  useEffect(() => {
    mountedRef.current = true;
    
    // Initialize map with a small delay to ensure DOM is ready
    const initMap = () => {
      if (!mapRef.current && mountedRef.current) {
        const mapContainer = document.getElementById('map-container');
        if (mapContainer) {
          mapRef.current = L.map('map-container').setView([5.648, 100.485], 15);
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
          }).addTo(mapRef.current);
          
          console.log("🗺️ MAP: initialized");
        }
      }
    };
    
    // Initialize map immediately or with a small delay
    setTimeout(initMap, 100);

    // Subscribe to real-time location updates with safe channel pattern
    if (channelRef.current) return; // Prevent double subscription

    console.log("🛰️ MAP: subscribing guard_location channel...");

    const channel = supabase.channel("guard_location", { config: { broadcast: { self: false } } })
      .on("broadcast", { event: "location_update" }, (payload) => {
        console.log("🛰️ MAP: incoming payload", payload.payload);
        const { lat, lng, name } = payload.payload || {};
        if (!mapRef.current || !lat || !lng) return;

        // 🧭 [DEBUG] First payload check
        console.log("🧭 [DEBUG] First payload check →",
          "map:", !!mapRef.current,
          "points:", routePoints.current.length,
          "paused:", isTrackingPaused,
          "lat:", lat, "lng:", lng
        );

        // store route points
        routePoints.current.push([lat, lng]);

        // update marker with safety
        try {
          if (!markerRef.current) {
            markerRef.current = L.marker([lat, lng]).addTo(mapRef.current).bindPopup(name || "Guard Active");
            mapRef.current.flyTo([lat, lng], 17, { animate: true, duration: 1.2 });
          } else {
            markerRef.current.setLatLng([lat, lng]);
          }
        } catch (err) {
          console.warn("⚠️ MAP marker render error", err.message);
        }

        // update polyline
        if (polylineRef.current) mapRef.current.removeLayer(polylineRef.current);
        polylineRef.current = L.polyline(routePoints.current, { color: "green", weight: 4 }).addTo(mapRef.current);
      })
      .subscribe();

    channelRef.current = channel;

    // Cleanup on unmount
    return () => {
      mountedRef.current = false;
      console.log("🧹 MAP: cleaning single channel guard_location");
      try {
        if (mapRef.current && mapRef.current.remove) {
          mapRef.current.remove();
          console.log("🧹 Map removed safely");
        }
      } catch (err) {
        console.warn("🧹 Cleanup skipped:", err.message);
      }
      // Clean up single marker
      if (markerRef.current) {
        try {
          mapRef.current?.removeLayer(markerRef.current);
          markerRef.current = null;
        } catch (err) {
          console.warn("🧹 Marker cleanup skipped:", err.message);
        }
      }
      // Clean up all markers from Map
      markersRef.current.forEach(marker => {
        try {
          if (marker) mapRef.current?.removeLayer(marker);
        } catch (err) {
          console.warn("🧹 Marker cleanup skipped:", err.message);
        }
      });
      markersRef.current.clear();
      polylineRef.current = null;
      routePoints.current = [];
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, []);

  return (
    <motion.div
      className="rounded-2xl overflow-hidden border border-gray-200 shadow-md"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="flex items-baseline justify-between px-4 pt-4">
        <h3 className="text-lg font-semibold text-[#0B132B]">🗺️ Live Guard Tracking</h3>
        <p className="text-xs text-gray-500">Last update: just now</p>
      </div>
      <div className="h-[420px] w-full relative">
        <div id="map-container" className="h-full w-full z-0"></div>
        
        {/* Speed Legend */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md border border-gray-200 rounded-xl shadow-md px-3 py-2 flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-700 max-w-[90%]"
        >
          <div className="flex items-center gap-1">
            <span className="w-3 h-2 sm:w-4 sm:h-2 rounded-sm bg-green-500"></span>
            <span className="hidden sm:inline">Normal</span>
            <span className="sm:hidden">N</span>
            <span className="text-xs text-gray-500 hidden sm:inline">&lt;10km/h</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-2 sm:w-4 sm:h-2 rounded-sm bg-orange-500"></span>
            <span className="hidden sm:inline">Moderate</span>
            <span className="sm:hidden">M</span>
            <span className="text-xs text-gray-500 hidden sm:inline">10-40km/h</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-2 sm:w-4 sm:h-2 rounded-sm bg-red-500"></span>
            <span className="hidden sm:inline">High Speed</span>
            <span className="sm:hidden">H</span>
            <span className="text-xs text-gray-500 hidden sm:inline">&gt;40km/h</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}