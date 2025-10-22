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

export default function MapRealtime() {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const polylineRef = useRef(null);
  const routeCoordsRef = useRef([]);
  const [guards, setGuards] = useState([]);
  const markersRef = useRef(new Map()); // Store multiple markers by guard ID
  const prevPositionRef = useRef(null); // Store previous position for speed calculation
  const subscribedRef = useRef(false); // Prevent multiple subscriptions
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

    // Subscribe to real-time location updates with auto-reconnect
    if (!subscribedRef.current) {
      subscribedRef.current = true;
      
      const subscribeToGuardChannel = () => {
        console.log("🛰️ MAP: subscribing guard_location...");
        const channel = supabase
          .channel("guard_location")
          .on("broadcast", { event: "location_update" }, ({ payload }) => {
            console.log("🛰️ MAP: incoming payload", payload);
            
            if (!mapRef.current) return; // prevent calling before map is ready
            
            const { lat, lng, id, name, status } = payload;
            
            if (lat && lng) {
              console.log("🛰️ MAP: new position", { lat, lng, id });
              
              // Handle marker creation and updates
              if (!markerRef.current) {
                markerRef.current = L.marker([lat, lng]).addTo(mapRef.current);
                markerRef.current.bindPopup("Guard Active").openPopup();
                
                // ✅ Auto-center map to guard location
                mapRef.current.setView([lat, lng], 18, { animate: true });
                console.log("🛰️ MAP: marker created & map centered");
              } else {
                markerRef.current.setLatLng([lat, lng]);
                console.log("🛰️ MAP: marker updated", { lat, lng });
              }
              
              // Add to route coordinates
              routeCoordsRef.current.push([lat, lng]);
              console.log("🛰️ MAP: route points", routeCoordsRef.current.length);
              
              // Calculate speed if we have previous position
              let speedKmh = 0;
              if (prevPositionRef.current) {
                const prevPos = prevPositionRef.current;
                const distance = L.latLng(prevPos.lat, prevPos.lng).distanceTo(L.latLng(lat, lng));
                const timeDiff = (Date.now() - prevPos.timestamp) / 1000; // seconds
                if (timeDiff > 0) {
                  speedKmh = Math.abs(distance / timeDiff) * 3.6; // Convert m/s to km/h
                }
              }
              
              // Store current position for next calculation
              prevPositionRef.current = { lat, lng, timestamp: Date.now() };
              
              // Update or create polyline with error handling
              if (routeCoordsRef.current.length > 1) {
                if (polylineRef.current) {
                  try {
                    polylineRef.current.setLatLngs(routeCoordsRef.current);
                    
                    // Update polyline color based on speed
                    let color = "green";
                    if (speedKmh >= 10 && speedKmh < 40) color = "orange";
                    else if (speedKmh >= 40) color = "red";
                    
                    polylineRef.current.setStyle({ color });
                    console.log("🛰️ MAP: polyline updated with", routeCoordsRef.current.length, "points, speed:", speedKmh.toFixed(1), "km/h, color:", color);
                  } catch (e) {
                    console.warn("⚠️ Polyline update skipped (map still animating)");
                  }
                } else {
                  // Calculate speed-based color for new polyline
                  let color = "green";
                  if (speedKmh >= 10 && speedKmh < 40) color = "orange";
                  else if (speedKmh >= 40) color = "red";
                  
                  polylineRef.current = L.polyline(routeCoordsRef.current, {
                    color: color,
                    weight: 5,
                    opacity: 0.8,
                  }).addTo(mapRef.current);
                  
                  console.log("🛰️ MAP: polyline created with", routeCoordsRef.current.length, "points, speed:", speedKmh.toFixed(1), "km/h, color:", color);
                }
              }
            }
            
            // Update guards state
            setGuards(prev => 
              prev.map(g => 
                g.id === id 
                  ? { ...g, lat, lng, name, status }
                  : g
              )
            );
          })
          .subscribe((status) => {
            if (status === "CLOSED") {
              console.warn("⚠️ MAP channel closed — retrying in 3s...");
              setTimeout(subscribeToGuardChannel, 3000);
            }
          });
        return channel;
      };

      const channel = subscribeToGuardChannel();
      
      // Cleanup on unmount
      return () => {
        mountedRef.current = false;
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
        routeCoordsRef.current = [];
        supabase.removeChannel(channel);
        subscribedRef.current = false;
      };
    }
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