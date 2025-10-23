import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { motion } from "framer-motion";
import { supabase } from "../../lib/supabaseClient";
import { getGuardChannel } from "../../lib/guardChannel";
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
  const routeRef = useRef([]);
  const channelRef = useRef(null);
  const [guards, setGuards] = useState([]);
  const markersRef = useRef(new Map()); // Store multiple markers by guard ID
  const prevPositionRef = useRef(null); // Store previous position for speed calculation
  const mountedRef = useRef(true); // Prevent operations on unmounted component
  const lastUpdateRef = useRef(0); // Debounce updates

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

    const channel = getGuardChannel()
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

        // Safety checks and marker updates
        if (!mapRef?.current || !payload?.payload) return;

        try {
          const { lat, lng, name } = payload.payload;
          if (!lat || !lng) return;
          
          // Debounce updates to prevent excessive redraws
          const now = Date.now();
          if (now - lastUpdateRef.current < 1000) return; // Update max once per second
          lastUpdateRef.current = now;

          // Update marker safely with proper icon handling
          if (!markerRef.current) {
            // Create custom icon with fallback
            const guardIcon = L.icon({
              iconUrl: "/images/guard-icon.png",
              iconSize: [40, 40],
              iconAnchor: [20, 40],
              popupAnchor: [0, -40],
            });
            
            // Add error handling for missing icon
            guardIcon.on('error', () => {
              console.warn('Guard icon not found, using default marker');
              markerRef.current.setIcon(L.divIcon({
                className: 'custom-guard-marker',
                html: '<div style="background-color: #3b82f6; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
              }));
            });
            
            markerRef.current = L.marker([lat, lng], {
              icon: guardIcon,
            }).addTo(mapRef.current);
            
            // Bind popup with guard info
            markerRef.current.bindPopup(`
              <div class="text-center">
                <b>${name || 'Guard Active'}</b><br/>
                <small>Status: Patrolling</small>
              </div>
            `);
            
            console.log("🛰️ MAP: marker created & map centered");
            // Auto-center map on first location
            mapRef.current.flyTo([lat, lng], 17, { 
              animate: true, 
              duration: 1.5,
              easeLinearity: 0.25
            });
          } else {
            markerRef.current.setLatLng([lat, lng]);
            console.log("🛰️ MAP: marker updated", { lat, lng });
          }

          // Update polyline route points safely - use single polyline instead of segments
          routePoints.current.push([lat, lng]);
          
          // Create or update single polyline instead of multiple segments
          if (routePoints.current.length > 1) {
            if (!polylineRef.current) {
              // Create new polyline
              polylineRef.current = L.polyline(routePoints.current, { 
                color: "green", 
                weight: 4,
                opacity: 0.8
              }).addTo(mapRef.current);
            } else {
              // Update existing polyline
              polylineRef.current.setLatLngs(routePoints.current);
            }
          }
        } catch (err) {
          console.warn("⚠️ MAP update skipped:", err.message);
        }
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
      
      // Clean up single polyline
      if (polylineRef.current) {
        try {
          mapRef.current?.removeLayer(polylineRef.current);
        } catch (err) {
          console.warn("🧹 Polyline cleanup skipped:", err.message);
        }
        polylineRef.current = null;
      }
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