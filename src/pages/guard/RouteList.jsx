// ✅ AHE SmartPatrol v2.4 — KONKRIT FIELD FIX
// Stay on route until Selfie OUT, no auto redirect at all.

import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { getGuardChannel, closeGuardChannel } from "../../lib/guardChannel";
import { sendTelegramPhoto } from "../../shared/api/telegram";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Loader2 } from "lucide-react";
import GuardBottomNav from "../../components/GuardBottomNav";
import toast from "react-hot-toast";
import "leaflet/dist/leaflet.css";

let gpsWatchId = null;

// --- Map helpers -------------------------------------------------------------
function MapCenter({ center, zoom }) {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (center && map && !done.current) {
      map.flyTo(center, zoom || 17, { animate: true, duration: 1.2 });
      done.current = true;
    }
  }, [center, map, zoom]);
  return null;
}

function PolylineTracker({ center, polylineRef, coordsRef }) {
  const map = useMap();
  const last = useRef(0);
  useEffect(() => {
    if (!center || !map) return;
    const now = Date.now();
    if (now - last.current < 1500) return;
    last.current = now;
    const prev = coordsRef.current.at(-1);
    if (prev && Math.abs(center[0] - prev[0]) < 0.00003 && Math.abs(center[1] - prev[1]) < 0.00003) return;
    coordsRef.current.push(center);
    if (!polylineRef.current) {
      polylineRef.current = L.polyline(coordsRef.current, { color: "#00b300", weight: 4, opacity: 0.8 }).addTo(map);
    } else polylineRef.current.addLatLng(center);
  }, [center, map]);
  return null;
}

// --- Main --------------------------------------------------------------------
export default function RouteList() {
  const navigate = useNavigate();

  const [assignments, setAssignments] = useState([]);
  const [doneIds, setDoneIds] = useState([]);
  const [guardPos, setGuardPos] = useState(null);
  const [guardName, setGuardName] = useState(localStorage.getItem("guardName") || "");
  const [plateNo, setPlateNo] = useState(localStorage.getItem("plateNo") || "");
  const [registered, setRegistered] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [selfieType, setSelfieType] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const uploadingRef = useRef(new Set());
  const polylineRef = useRef(null);
  const coordsRef = useRef([]);

  // --- Hard-lock to stay on this page ----------------------------------------
  useEffect(() => {
    localStorage.setItem("registered", "true");
    sessionStorage.setItem("stayOnRoute", "true");
    return () => sessionStorage.removeItem("stayOnRoute");
  }, []);

  // --- Fetch assignments -----------------------------------------------------
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("patrol_assignments")
        .select("*")
        .eq("status", "pending")
        .eq("community_name", "Prima Residensi Utama")
        .order("created_at");
      setAssignments(data || []);
    })();
  }, []);

  // --- GPS Tracking ----------------------------------------------------------
  useEffect(() => {
    if (!navigator.geolocation) return;
    gpsWatchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        if (accuracy > 15) return;
        setGuardPos((p) => (!p ? [latitude, longitude] : [latitude, longitude]));
        try {
          getGuardChannel().send({
            type: "broadcast",
            event: "location_update",
            payload: { lat: latitude, lng: longitude, name: guardName || "Guard", status: "Patrolling" },
          });
        } catch {}
      },
      (e) => console.warn("GPS error:", e.message),
      { enableHighAccuracy: true }
    );
    return () => gpsWatchId && navigator.geolocation.clearWatch(gpsWatchId);
  }, [guardName]);

  // --- Upload helper ---------------------------------------------------------
  const uploadToSupabase = async (path, blob) => {
    const { error } = await supabase.storage.from("patrol-photos").upload(path, blob, { upsert: true });
    if (error) throw error;
    return supabase.storage.from("patrol-photos").getPublicUrl(path).data.publicUrl;
  };

  // --- Handle Snap (stay in page) --------------------------------------------
  const handleSnap = async (file, a) => {
    if (!file || uploadingRef.current.has(a.id)) return;
    uploadingRef.current.add(a.id);
    setLoading(true);
    try {
      const ts = Date.now();
      const coords = guardPos ? `${guardPos[0]},${guardPos[1]}` : "No GPS";
      const path = `houses/${a.house_no}_${ts}.jpg`;
      const url = await uploadToSupabase(path, file);
      await sendTelegramPhoto(
        url,
        `🏠 *${a.house_no} ${a.street_name} (${a.block})*\n👮 ${guardName}\n🏍️ ${plateNo}\n📍 ${coords}\n🕓 ${new Date().toLocaleString()}`
      );
      setDoneIds((d) => [...new Set([...d, a.id])]);
      toast.success(`✅ ${a.house_no} sent`);
    } catch (e) {
      toast.error("Upload failed");
    } finally {
      setLoading(false);
      uploadingRef.current.delete(a.id);
    }
  };

  // --- Camera ----------------------------------------------------------------
  const openCamera = async (t) => {
    setSelfieType(t);
    setShowCamera(true);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      videoRef.current.srcObject = s;
      videoRef.current.style.transform = "scaleX(-1)";
      await videoRef.current.play();
    } catch {
      toast.error("Camera not accessible");
      setShowCamera(false);
    }
  };

  const captureSelfie = async () => {
    const c = canvasRef.current, x = c.getContext("2d");
    x.translate(c.width, 0); x.scale(-1, 1);
    x.drawImage(videoRef.current, 0, 0, 400, 300);
    const blob = await (await fetch(c.toDataURL("image/jpeg"))).blob();
    const ts = Date.now();
    const path = `selfies/${guardName}_${selfieType}_${ts}.jpg`;
    const url = await uploadToSupabase(path, blob);
    const coords = guardPos ? `${guardPos[0]},${guardPos[1]}` : "No GPS";
    const cap =
      selfieType === "selfieIn"
        ? `🚨 Guard On Duty\n👮 ${guardName}\n🏍️ ${plateNo}\n📍 ${coords}`
        : `✅ Patrol Ended\n👮 ${guardName}\n🏍️ ${plateNo}\n📍 ${coords}`;
    await sendTelegramPhoto(url, cap);
    setShowCamera(false);
    if (selfieType === "selfieOut") {
      closeGuardChannel();
      toast.success("✅ Patrol Ended");
      sessionStorage.removeItem("stayOnRoute");
      setTimeout(() => navigate("/guard/dashboard"), 600);
    }
  };

  // --- Grouping --------------------------------------------------------------
  const grouped = assignments.reduce((a, r) => {
    (a[r.session_no || 0] ||= []).push(r);
    return a;
  }, {});

  // --- UI --------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#f7faff] p-4 space-y-4 pb-16">
      <h1 className="text-2xl font-bold text-[#0B132B]">Guard Routes</h1>

      <div className="flex gap-2">
        <button onClick={() => openCamera("selfieIn")} className="bg-green-600 text-white px-4 py-2 rounded">Selfie IN</button>
        <button onClick={() => openCamera("selfieOut")} className="bg-rose-600 text-white px-4 py-2 rounded">Selfie OUT</button>
      </div>

      <div className="h-[360px] rounded-xl overflow-hidden shadow bg-white mt-3">
        <MapContainer center={guardPos || [5.65, 100.5]} zoom={16} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapCenter center={guardPos} />
          <PolylineTracker center={guardPos} polylineRef={polylineRef} coordsRef={coordsRef} />
          {guardPos && <Marker position={guardPos}><Popup>{guardName}</Popup></Marker>}
          {assignments.map((a) => (
            <Marker key={a.id} position={[a.lat || 0, a.lng || 0]}>
              <Popup>
                {a.house_no} {a.street_name} ({a.block})<br />
                {doneIds.includes(a.id) ? (
                  <button disabled className="bg-green-500 text-white px-2 py-1 text-xs rounded mt-2">✅ Done</button>
                ) : (
                  <label className="bg-blue-500 text-white px-2 py-1 text-xs rounded mt-2 cursor-pointer">
                    <input type="file" accept="image/*" capture="environment" hidden onChange={(e) => handleSnap(e.target.files[0], a)} />
                    📸 Snap
                  </label>
                )}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="bg-white p-4 rounded-xl shadow mt-3">
        <h3 className="font-semibold mb-2">🏠 Assigned Houses</h3>
        {Object.keys(grouped).map((s) => (
          <div key={s} className="mb-3">
            <h4 className="font-semibold mb-1">Session {s}</h4>
            {grouped[s].map((a) => (
              <div key={a.id} className="flex justify-between border-b py-1 text-sm">
                <span>{a.house_no} {a.street_name} ({a.block})</span>
                {doneIds.includes(a.id)
                  ? <span className="text-green-600">✅ Done</span>
                  : <label className="cursor-pointer text-blue-600">
                      <input type="file" accept="image/*" capture="environment" hidden onChange={(e) => handleSnap(e.target.files[0], a)} />
                      📸 Snap
                    </label>}
              </div>
            ))}
          </div>
        ))}
      </div>

      {showCamera && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999]">
          <div className="bg-white p-4 rounded-xl shadow-lg w-[420px]">
            <video ref={videoRef} width="400" height="300" autoPlay playsInline className="rounded-md" />
            <canvas ref={canvasRef} width="400" height="300" hidden />
            <div className="mt-2 flex gap-2">
              <button onClick={captureSelfie} className="bg-blue-600 text-white py-2 rounded w-full">Capture</button>
              <button onClick={() => setShowCamera(false)} className="bg-gray-400 text-black py-2 rounded w-full">Close</button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999]">
          <div className="bg-white p-5 rounded-xl flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <p>Uploading...</p>
          </div>
        </div>
      )}

      <GuardBottomNav />
    </div>
  );
}
