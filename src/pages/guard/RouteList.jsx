// SmartPatrol Hybrid Stable v3 - Guard Side (Static Admin Mode)
let gpsWatchId = null;
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { getGuardChannel, closeGuardChannel } from "../../lib/guardChannel";
import { sendTelegramPhoto } from "../../shared/api/telegram";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Camera, Loader2 } from "lucide-react";
import GuardBottomNav from "../../components/GuardBottomNav";
import toast from "react-hot-toast";

// Smooth map movement
function MapCenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, 18, { animate: true, duration: 1.2 });
    }
  }, [center]);
  return null;
}

// Draw green route
function PolylineTracker({ center, polylineRef, routeCoords }) {
  const map = useMap();
  useEffect(() => {
    if (!center) return;
    routeCoords.current.push(center);
    if (!polylineRef.current) {
      polylineRef.current = L.polyline(routeCoords.current, {
        color: "green",
        weight: 5,
        opacity: 0.9,
      }).addTo(map);
    } else {
      polylineRef.current.setLatLngs(routeCoords.current);
    }
  }, [center]);
  return null;
}

export default function RouteList() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [guardName, setGuardName] = useState(localStorage.getItem("guardName") || "");
  const [plateNo, setPlateNo] = useState(localStorage.getItem("plateNo") || "");
  const [registered, setRegistered] = useState(localStorage.getItem("registered") === "true");
  const [guardPos, setGuardPos] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [selfieType, setSelfieType] = useState(null);
  const [doneHouseIds, setDoneHouseIds] = useState([]);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const polylineRef = useRef(null);
  const routeCoords = useRef([]);
  const mapRef = useRef(null);
  const uploadingRef = useRef(new Set());

  // ✅ fix: ensure guardName ready before fetch
  useEffect(() => {
    if (guardName) {
      setTimeout(() => fetchAssignments(), 200);
    }
  }, [guardName]);

  const fetchAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from("patrol_assignments")
        .select("*")
        .eq("guard_name", guardName)
        .order("session_no", { ascending: true });
      if (error) throw error;
      setAssignments(data || []);
      console.log("✅ Assignments loaded:", data?.length);
    } catch (err) {
      console.error("❌ Fetch assignment error:", err.message);
    }
  };

  // ✅ GPS broadcast
  useEffect(() => {
    if (!navigator.geolocation) return;
    gpsWatchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setGuardPos([latitude, longitude]);
        const channel = getGuardChannel();
        channel.send({
          type: "broadcast",
          event: "location_update",
          payload: {
            lat: latitude,
            lng: longitude,
            name: guardName || "Guard Active",
            status: "Patrolling",
          },
        });
      },
      (err) => console.warn("⚠️ GPS error:", err.message),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
    );
    return () => {
      if (gpsWatchId) navigator.geolocation.clearWatch(gpsWatchId);
      closeGuardChannel();
    };
  }, []);

  // 📤 upload
  const uploadToSupabase = async (filePath, blob) => {
    const { error } = await supabase.storage
      .from("patrol-photos")
      .upload(filePath, blob, { contentType: "image/jpeg", upsert: true });
    if (error) throw error;
    const { data } = await supabase.storage.from("patrol-photos").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const captureSelfie = async () => {
    try {
      if (!videoRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(videoRef.current, 0, 0, 400, 300);
      const blob = await fetch(canvas.toDataURL("image/jpeg")).then((r) => r.blob());
      const ts = Date.now();
      const filePath = `selfies/${guardName}_${plateNo}_${selfieType}_${ts}.jpg`;
      const photoUrl = await uploadToSupabase(filePath, blob);
      const caption = `📸 ${selfieType === "selfieIn" ? "On Duty" : "Patrol Ended"}\n👤 ${guardName}\n🏍️ ${plateNo}`;
      await sendTelegramPhoto(photoUrl, caption);
      if (selfieType === "selfieOut") {
        navigator.geolocation.clearWatch(gpsWatchId);
        closeGuardChannel();
        navigate("/guard/dashboard");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUploadFile = async (file, a) => {
    const { id, house_no, street_name, block } = a;
    if (uploadingRef.current.has(id)) return;
    uploadingRef.current.add(id);
    const ts = Date.now();
    const blob = file;
    const filePath = `houses/${house_no}_${plateNo}_${ts}.jpg`;
    const url = await uploadToSupabase(filePath, blob);
    const coords = guardPos ? `${guardPos[0]},${guardPos[1]}` : "No GPS";
    const caption = `🏠 *${house_no} ${street_name} (${block})*\n👤 ${guardName}\n📍 ${coords}`;
    sendTelegramPhoto(url, caption);
    setDoneHouseIds((p) => [...p, id]);
    uploadingRef.current.delete(id);
  };

  const grouped = assignments.reduce((acc, a) => {
    const s = a.session_no || 0;
    if (!acc[s]) acc[s] = [];
    acc[s].push(a);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7faff] via-white to-[#edf3ff] p-4 pb-16 space-y-4">
      <h1 className="text-2xl font-bold text-[#0B132B]">Routes</h1>
      {!registered ? (
        <div className="bg-white border rounded-2xl p-4 max-w-md shadow">
          <h3 className="font-semibold mb-2">Register Guard</h3>
          <input className="border p-2 rounded w-full mb-2" value={guardName} onChange={(e) => setGuardName(e.target.value)} placeholder="Guard Name" />
          <input className="border p-2 rounded w-full mb-3" value={plateNo} onChange={(e) => setPlateNo(e.target.value)} placeholder="Plate Number" />
          <button
            onClick={() => {
              if (!guardName) return toast.error("Enter name first");
              setRegistered(true);
              localStorage.setItem("guardName", guardName);
              localStorage.setItem("plateNo", plateNo);
              localStorage.setItem("registered", "true");
              toast.success("✅ Registered");
            }}
            className="bg-blue-600 text-white px-3 py-2 rounded w-full"
          >
            Save
          </button>
        </div>
      ) : (
        <>
          <div className="flex gap-2">
            <button onClick={() => setSelfieType("selfieIn")} className="bg-green-500 text-white px-4 py-2 rounded">
              Selfie IN
            </button>
            <button onClick={() => setSelfieType("selfieOut")} className="bg-rose-500 text-white px-4 py-2 rounded">
              Selfie OUT
            </button>
          </div>
          <div className="h-[360px] w-full rounded-2xl overflow-hidden border shadow relative">
            <MapContainer ref={mapRef} center={guardPos || [5.65, 100.5]} zoom={16} style={{ height: "100%", width: "100%" }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapCenter center={guardPos} />
              <PolylineTracker center={guardPos} polylineRef={polylineRef} routeCoords={routeCoords} />
              {guardPos && <Marker position={guardPos}><Popup>{guardName}</Popup></Marker>}
              {assignments.map((a) => (
                <Marker key={a.id} position={[a.lat || 0, a.lng || 0]}>
                  <Popup>
                    {a.house_no} {a.street_name} ({a.block}) — Session {a.session_no}
                    {doneHouseIds.includes(a.id) ? (
                      <button className="bg-green-500 text-white rounded px-2 py-1 mt-2 text-xs" disabled>✅ Done</button>
                    ) : (
                      <label className="bg-blue-500 text-white rounded px-2 py-1 mt-2 text-xs cursor-pointer">
                        <input type="file" hidden accept="image/*" capture="environment" onChange={(e) => e.target.files[0] && handleUploadFile(e.target.files[0], a)} />📸 Snap
                      </label>
                    )}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
          <div className="bg-white rounded-2xl p-4 mt-4 shadow-sm">
            {Object.keys(grouped).map((s) => (
              <div key={s} className="mb-3">
                <h4 className="font-semibold">Session {s}</h4>
                <ul>
                  {grouped[s].map((a) => (
                    <li key={a.id} className="flex justify-between bg-gray-50 p-2 rounded mb-1">
                      <span>{a.house_no} {a.street_name} ({a.block})</span>
                      {doneHouseIds.includes(a.id) ? <span className="text-green-600 text-xs">✅ Done</span> : <span className="text-blue-500 text-xs">📸 Pending</span>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
      {loading && <div className="fixed inset-0 bg-black/60 flex items-center justify-center text-white">Uploading...</div>}
      <GuardBottomNav />
    </div>
  );
}
