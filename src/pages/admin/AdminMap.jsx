import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup } from "react-leaflet";
import { supabase } from "../../lib/supabaseClient";

export default function AdminMap() {
  const [guardTracks, setGuardTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [guards, setGuards] = useState([]);
  const [selectedGuard, setSelectedGuard] = useState("");
  const [center, setCenter] = useState([5.5956, 100.5626]); // Your actual site coordinates

  // Fetch guard tracks data from Supabase
  const fetchGuardTracks = async () => {
    try {
      const query = supabase
        .from("guard_tracks")
        .select("*")
        .order("created_at", { ascending: true });
      
      // Apply guard filter if selected
      if (selectedGuard) {
        query.eq("guard_name", selectedGuard);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching guard tracks:", error);
        return;
      }
      
      setGuardTracks(data || []);
      
      // Update guards list with unique guard names
      if (data && data.length > 0) {
        const uniqueGuards = [...new Set(data.map(track => track.guard_name))];
        setGuards(uniqueGuards);
        
        // Auto-center map on latest guard position
        const latestTrack = data[data.length - 1];
        if (latestTrack) {
          setCenter([latestTrack.lat, latestTrack.lng]);
        }
      }
    } catch (err) {
      console.error("fetchGuardTracks error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data every 10 seconds and when selected guard changes
  useEffect(() => {
    fetchGuardTracks();
    const interval = setInterval(fetchGuardTracks, 10000);
    return () => clearInterval(interval);
  }, [selectedGuard]);

  // Group tracks by guard name
  const groupedTracks = guardTracks.reduce((acc, track) => {
    if (!acc[track.guard_name]) {
      acc[track.guard_name] = [];
    }
    acc[track.guard_name].push(track);
    return acc;
  }, {});

  // Get color based on speed
  const getSpeedColor = (speed) => {
    if (speed <= 10) return "#22c55e"; // green
    if (speed <= 40) return "#f97316"; // orange
    return "#ef4444"; // red
  };

  // Get latest position for each guard
  const getLatestPositions = () => {
    const latest = {};
    guardTracks.forEach(track => {
      if (!latest[track.guard_name] || new Date(track.created_at) > new Date(latest[track.guard_name].created_at)) {
        latest[track.guard_name] = track;
      }
    });
    return Object.values(latest);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-lg text-primary">Loading guard tracks...</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full relative">
      <div className="absolute top-4 left-4 z-[1000] bg-white p-4 rounded-lg shadow-lg">
        <h1 className="text-xl font-bold text-primary mb-2">Real-time Guard Tracking</h1>
        <p className="text-sm text-gray-600">
          {selectedGuard ? `Filtered: ${selectedGuard}` : `${Object.keys(groupedTracks).length} guard(s) tracked`}
        </p>
      </div>

      {/* Speed Legend */}
      <div className="absolute bottom-4 right-4 z-[1000] bg-white p-4 rounded-lg shadow-lg">
        <h3 className="font-semibold mb-2">Speed Legend</h3>
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>≤ 10 km/h (Walking/Stopped)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded"></div>
            <span>20-40 km/h (Normal Speed)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>&gt; 40 km/h (High Speed)</span>
          </div>
        </div>
      </div>

      {/* Guard Filter Dropdown */}
      <div className="absolute top-4 right-4 z-[1000] bg-white p-4 rounded-lg shadow-lg">
        <div className="flex items-center gap-3">
          <label className="font-semibold text-gray-700">Filter Guard:</label>
          <select
            value={selectedGuard}
            onChange={(e) => setSelectedGuard(e.target.value)}
            className="border px-2 py-1 rounded"
            disabled={guards.length === 0}
          >
            <option value="">All Guards</option>
            {guards.map((guard, index) => (
              <option key={index} value={guard}>{guard}</option>
            ))}
          </select>
        </div>
      </div>

      <MapContainer
        center={center}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Draw polylines for each guard's route */}
        {Object.entries(groupedTracks).map(([guardName, tracks]) => {
          if (tracks.length < 2) return null;

          // Create segments with different colors based on speed
          const segments = [];
          for (let i = 0; i < tracks.length - 1; i++) {
            const current = tracks[i];
            const next = tracks[i + 1];
            const speed = next.speed || 0;
            
            segments.push({
              positions: [
                [current.lat, current.lng],
                [next.lat, next.lng]
              ],
              color: getSpeedColor(speed),
              speed: speed
            });
          }

          return segments.map((segment, index) => (
            <Polyline
              key={`${guardName}-${index}`}
              positions={segment.positions}
              color={segment.color}
              weight={4}
              opacity={0.8}
            />
          ));
        })}

        {/* Show latest position markers for each guard */}
        {getLatestPositions().map((track) => (
          <Marker
            key={`latest-${track.guard_name}`}
            position={[track.lat, track.lng]}
          >
            <Popup>
              <div>
                <h3 className="font-semibold">{track.guard_name}</h3>
                <p>Speed: {track.speed?.toFixed(1) || 0} km/h</p>
                <p>Time: {new Date(track.created_at).toLocaleString()}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
