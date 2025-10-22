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

  useEffect(() => {
    // Initialize map with a small delay to ensure DOM is ready
    const initMap = () => {
      if (!mapRef.current) {
        const mapContainer = document.getElementById('map-container');
        if (mapContainer) {
          mapRef.current = L.map('map-container').setView([5.648, 100.485], 15);
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
          }).addTo(mapRef.current);
          
          console.log("🛰️ MAP: map ready, updating markers/polylines");
        }
      }
    };
    
    // Initialize map immediately or with a small delay
    setTimeout(initMap, 100);

    // Subscribe to real-time location updates
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
          
          // Remove old polyline before drawing new
          if (polylineRef.current) {
            mapRef.current.removeLayer(polylineRef.current);
          }
          
          // Draw new polyline with route
          if (routeCoordsRef.current.length > 1) {
            // Calculate speed-based color (if speed is available in payload)
            const speed = payload.speed || 0;
            let color = "green";
            if (speed >= 10 && speed < 40) color = "orange";
            else if (speed >= 40) color = "red";
            
            polylineRef.current = L.polyline(routeCoordsRef.current, {
              color: color,
              weight: 5,
              opacity: 0.8,
            }).addTo(mapRef.current);
            
            console.log("🛰️ MAP: polyline updated with", routeCoordsRef.current.length, "points, color:", color);
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
      .subscribe();
    
    console.log("🛰️ MAP: channel subscribed guard_location");

    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      // Clean up single marker
      if (markerRef.current) {
        mapRef.current?.removeLayer(markerRef.current);
        markerRef.current = null;
      }
      // Clean up all markers from Map
      markersRef.current.forEach(marker => {
        if (marker) mapRef.current?.removeLayer(marker);
      });
      markersRef.current.clear();
      polylineRef.current = null;
      routeCoordsRef.current = [];
      supabase.removeChannel(channel);
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
      <div className="h-[420px] w-full">
        <div id="map-container" className="h-full w-full z-0"></div>
      </div>
    </motion.div>
  );
}