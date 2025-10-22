import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { motion } from "framer-motion";
import { supabase } from "../../lib/supabaseClient";
import "leaflet/dist/leaflet.css";

// Global guard icon definition with .jpg image
const guardIcon = L.icon({
  iconUrl: "/images/guard-icon.jpg",
  iconSize: [45, 45],
  iconAnchor: [22, 45],
  popupAnchor: [0, -45],
});

export default function MapRealtime() {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const polylineRef = useRef(null);
  const routeCoordsRef = useRef([]);
  const [guards, setGuards] = useState([]);
  const markersRef = useRef(new Map()); // Store multiple markers by guard ID
  
  // Debug log for icon path
  console.log("🛰️ MAP: using icon", guardIcon.options.iconUrl);

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
        console.log("🛰️ MAP: received location update", payload);
        
        if (!mapRef.current) return; // prevent calling before map is ready
        
        const { lat, lng, id, name, status } = payload;
        
        if (lat && lng) {
          console.log("🛰️ MAP: new position", { lat, lng, id });
          
          // Handle marker creation and updates
          if (!markerRef.current) {
            markerRef.current = L.marker([lat, lng], { icon: guardIcon }).addTo(mapRef.current);
            markerRef.current.bindPopup("Guard Active").openPopup();
            
            // ✅ Auto-center map on first selfie-in
            mapRef.current.setView([lat, lng], 18, { animate: true });
            console.log("🛰️ MAP: marker created & map centered");
          } else {
            // Update marker position on next coordinates
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
            const color = speed < 10 ? "green" : speed < 40 ? "orange" : "red";
            
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