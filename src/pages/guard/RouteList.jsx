// ✅ AHE SmartPatrol Guard RouteList (Final Stable)
// Fixed: Kamera selfie betul, map smooth, telegram format, guard dynamic.

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
import "leaflet/dist/leaflet.css";

let gpsWatchId = null;

// Smooth map centering
function MapCenter({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && map) map.flyTo(center, zoom || 17, { animate: true, duration: 1.2 });
  }, [center, map, zoom]);
  return null;
}

// Polyline guard tracking
function PolylineTracker({ center, refLine, refCoords }) {
  const map = useMap();
  useEffect(() => {
    if (!center || !map) return;
    refCoords.current.push(center);
    if (!refLine.current) {
      refLine.current = L.polyline(refCoords.current, {
        color: "green",
        weight: 4,
        opacity: 0.85,
      }).addTo(map);
    } else {
      refLine.current.setLatLngs(refCoords.current);
    }
  }, [center, map, refLine, refCoords]);
  return null;
}

export default function RouteList() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [doneIds, setDoneIds] = useState([]);
  const [guardPos, setGuardPos] = useState(null);
  const [loading, setLoading] = useState(false);

  const guardName = localStorage.getItem("guardName") || "Guard";
  const plateNo = localStorage.getItem("plateNo") || "-";

  const refLine = useRef(null);
  const refCoords = useRef([]);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const uploadingRef = useRef(new Set());

  const fetchAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from("patrol_assignments")
        .select("*")
        .eq("status", "pending")
        .eq("community_name", "Prima Residensi Utama");
      if (error) throw error;
      setAssignments(data || []);
      console.log("✅ patrol_assignments fetched:", data?.length);
    } catch (err) {
      toast.error("Gagal muat tugasan");
      console.error(err.message);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  // 🛰️ GPS broadcast realtime
  useEffect(() => {
    if (!navigator.geolocation) return;
    gpsWatchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setGuardPos([latitude, longitude]);
        try {
          const ch = getGuardChannel();
          ch.send({
            type: "broadcast",
            event: "location_update",
            payload: { lat: latitude, lng: longitude, name: guardName, status: "Patrolling" },
          });
        } catch (e) {
          console.warn("GPS broadcast fail:", e.message);
        }
      },
      (err) => console.warn("GPS error:", err.message),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
    );
    return () => {
      if (gpsWatchId) navigator.geolocation.clearWatch(gpsWatchId);
    };
  }, [guardName]);

  const uploadToSupabase = async (path, blob) => {
    const { error } = await supabase.storage.from("patrol-photos").upload(path, blob, {
      contentType: "image/jpeg",
      upsert: true,
    });
    if (error) throw error;
    const { data } = await supabase.storage.from("patrol-photos").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSnap = async (file, a) => {
    if (!file || !a || uploadingRef.current.has(a.id)) return;
    uploadingRef.current.add(a.id);
    setLoading(true);
    try {
      const ts = Date.now();
      const coords = guardPos ? `${guardPos[0]},${guardPos[1]}` : "No GPS";
      const filePath = `houses/${a.house_no}_${ts}.jpg`;
      const photoUrl = await uploadToSupabase(filePath, file);
      const caption = `🏠 *${a.house_no} ${a.street_name} (${a.block})*\n👤 ${guardName}\n🏍️ ${plateNo}\n📍 ${coords}\n🕓 ${new Date().toLocaleString()}`;
      await sendTelegramPhoto(photoUrl, caption);
      setDoneIds((p) => [...p, a.id]);
      toast.success("✅ Gambar dihantar ke Telegram!");
    } catch (err) {
      console.error("Snap error:", err.message);
      toast.error("❌ Gagal upload foto");
    } finally {
      setLoading(false);
      uploadingRef.current.delete(a.id);
    }
  };

  // 📸 Selfie camera modal
  const [showCamera, setShowCamera] = useState(false);
  const [selfieType, setSelfieType] = useState(null);

  const openCamera = async (type) => {
    setSelfieType(type);
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: type === "selfieIn" ? "user" : "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      toast.error("Kamera gagal diakses");
    }
  };

  const captureSelfie = async () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, 400, 300);
    const blob = await (await fetch(canvas.toDataURL("image/jpeg"))).blob();
    const ts = Date.now();
    const filePath = `selfies/${guardName}_${selfieType}_${ts}.jpg`;
    const photoUrl = await uploadToSupabase(filePath, blob);
    const caption = `📸 ${selfieType === "selfieIn" ? "Selfie IN" : "Selfie OUT"} oleh ${guardName}\n🕓 ${new Date().toLocaleString()}`;
    await sendTelegramPhoto(photoUrl, caption);
    setShowCamera(false);
    if (selfieType === "selfieOut") {
      closeGuardChannel();
      toast.success("✅ Rondaan Tamat");
      setTimeout(() => navigate("/guard/dashboard"), 600);
    }
  };

  const grouped = assignments.reduce((acc, a) => {
    const s = a.session_no || 0;
    if (!acc[s]) acc[s] = [];
    acc[s].push(a);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#f7faff] p-4 space-y-4 pb-16">
      <h1 className="text-2xl font-bold">Routes</h1>

      <div className="flex gap-2">
        <button onClick={() => openCamera("selfieIn")} className="bg-green-500 text-white px-4 py-2 rounded">
          Selfie IN
        </button>
        <button onClick={() => openCamera("selfieOut")} className="bg-rose-500 text-white px-4 py-2 rounded">
          Selfie OUT
        </button>
      </div>

      <div className="h-[360px] rounded-xl overflow-hidden shadow bg-white mt-3">
        <MapContainer center={guardPos || [5.65, 100.5]} zoom={16} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapCenter center={guardPos} />
          <PolylineTracker center={guardPos} refLine={refLine} refCoords={refCoords} />
          {guardPos && <Marker position={guardPos}><Popup>{guardName}</Popup></Marker>}
          {assignments.map((a) => (
            <Marker key={a.id} position={[a.lat || 0, a.lng || 0]}>
              <Popup>
                {a.house_no} {a.street_name} ({a.block})
                <br />
                {doneIds.includes(a.id) ? (
                  <button disabled className="bg-green-500 text-white px-2 py-1 text-xs rounded mt-2">✅ Done</button>
                ) : (
                  <label className="bg-blue-500 text-white px-2 py-1 text-xs rounded mt-2 cursor-pointer">
                    <input type="file" accept="image/*" hidden onChange={(e) => handleSnap(e.target.files[0], a)} />
                    📸 Snap
                  </label>
                )}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* House list */}
      <div className="bg-white p-4 rounded-xl shadow mt-3">
        <h3 className="font-semibold mb-2">🏠 Assigned Houses</h3>
        {Object.keys(grouped).map((s) => (
          <div key={s} className="mb-3">
            <h4 className="font-semibold mb-1">Session {s}</h4>
            {grouped[s].map((a) => (
              <div key={a.id} className="flex justify-between border-b py-1">
                <span>{a.house_no} {a.street_name}</span>
                {doneIds.includes(a.id) ? (
                  <span className="text-green-600">✅ Done</span>
                ) : (
                  <label className="cursor-pointer text-blue-600">
                    <input type="file" accept="image/*" hidden onChange={(e) => handleSnap(e.target.files[0], a)} />
                    📸 Snap
                  </label>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {showCamera && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999]">
          <div className="bg-white p-4 rounded-xl shadow-lg z-[10000]">
            <video ref={videoRef} width="380" height="280" autoPlay playsInline className="rounded" />
            <canvas ref={canvasRef} width="400" height="300" hidden />
            <div className="mt-2 flex gap-2">
              <button onClick={captureSelfie} className="bg-blue-600 text-white px-4 py-2 rounded w-full">Capture</button>
              <button onClick={() => setShowCamera(false)} className="bg-gray-400 text-black px-4 py-2 rounded w-full">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999]">
          <div className="bg-white p-4 rounded-xl flex flex-col items-center gap-2">
            <Loader2 className="animate-spin w-6 h-6 text-blue-500" />
            <p>Muat naik...</p>
          </div>
        </div>
      )}

      <GuardBottomNav />
    </div>
  );
}