// ✅ AHE SmartPatrol v2.1 (Stable GPS + Smooth Polyline)
// RouteList.jsx — guard routes + selfie + Telegram + smoother map tracking
// Dynamic guard login, live map, Telegram upload (stable)

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

// ✅ Map flyTo sekali sahaja masa mula
function MapCenter({ center, zoom }) {
  const map = useMap();
  const hasCenteredRef = useRef(false);

  useEffect(() => {
    if (center && map && !hasCenteredRef.current) {
      map.flyTo(center, zoom || 17, { animate: true, duration: 1.3 });
      hasCenteredRef.current = true;
    }
  }, [center, map, zoom]);
  return null;
}

// ✅ Stable polyline tracker — filter jitter + debounce
function PolylineTracker({ center, polylineRef, coordsRef }) {
  const map = useMap();
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    if (!center || !map) return;
    const now = Date.now();
    // 🕐 Debounce 1.5s
    if (now - lastUpdateRef.current < 1500) return;
    lastUpdateRef.current = now;

    const last = coordsRef.current.at(-1);
    if (last) {
      // 🧭 Skip if movement < 3 m (≈0.00003°)
      const dx = Math.abs(center[0] - last[0]);
      const dy = Math.abs(center[1] - last[1]);
      if (dx < 0.00003 && dy < 0.00003) return;
    }

    coordsRef.current.push(center);
    if (!polylineRef.current) {
      polylineRef.current = L.polyline(coordsRef.current, {
        color: "#00b300",
        weight: 4,
        opacity: 0.85,
        smoothFactor: 1,
      }).addTo(map);
    } else {
      polylineRef.current.addLatLng(center);
    }
  }, [center, map]);
  return null;
}

export default function RouteList() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [doneIds, setDoneIds] = useState([]);
  const [guardPos, setGuardPos] = useState(null);
  const [guardName, setGuardName] = useState(localStorage.getItem("guardName") || "");
  const [plateNo, setPlateNo] = useState(localStorage.getItem("plateNo") || "");
  const [registered, setRegistered] = useState(localStorage.getItem("registered") === "true");
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [selfieType, setSelfieType] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const uploadingRef = useRef(new Set());
  const polylineRef = useRef(null);
  const coordsRef = useRef([]);

  // ✅ Fetch patrol assignments
  const fetchAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from("patrol_assignments")
        .select("*")
        .eq("status", "pending")
        .eq("community_name", "Prima Residensi Utama")
        .order("created_at", { ascending: true });
      if (error) throw error;
      setAssignments(data || []);
      console.log("✅ Patrol assignments fetched:", data?.length);
    } catch (err) {
      console.error("❌ Fetch assignments error:", err.message);
      toast.error("Failed to load patrol assignments.");
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  // ✅ GPS tracking + broadcast (stabil)
  useEffect(() => {
    if (!navigator.geolocation) {
      toast.error("GPS not supported");
      return;
    }

    gpsWatchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        if (accuracy > 15) return; // 🚫 Skip low accuracy (>15m)

        setGuardPos((prev) => {
          if (!prev) return [latitude, longitude];
          const dx = Math.abs(latitude - prev[0]);
          const dy = Math.abs(longitude - prev[1]);
          if (dx < 0.00003 && dy < 0.00003) return prev; // 🚫 Skip small move
          return [latitude, longitude];
        });

        try {
          const ch = getGuardChannel();
          ch.send({
            type: "broadcast",
            event: "location_update",
            payload: {
              lat: latitude,
              lng: longitude,
              name: guardName || "Guard",
              status: "Patrolling",
            },
          });
        } catch (e) {
          console.warn("⚠️ GPS broadcast fail:", e.message);
        }
      },
      (err) => console.warn("⚠️ GPS error:", err.message),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    );

    return () => {
      if (gpsWatchId) navigator.geolocation.clearWatch(gpsWatchId);
    };
  }, [guardName]);

  // ✅ Upload helper
  const uploadToSupabase = async (filePath, blob) => {
    const { error } = await supabase.storage
      .from("patrol-photos")
      .upload(filePath, blob, { contentType: "image/jpeg", upsert: true });
    if (error) throw error;
    const { data } = await supabase.storage
      .from("patrol-photos")
      .getPublicUrl(filePath);
    return data.publicUrl;
  };

  // ✅ Snap photo & send Telegram
  const handleSnap = async (file, a) => {
    if (!file || !a) return;
    if (uploadingRef.current.has(a.id)) return;
    uploadingRef.current.add(a.id);
    setLoading(true);
    try {
      const ts = Date.now();
      const coords = guardPos ? `${guardPos[0]},${guardPos[1]}` : "No GPS";
      const filePath = `houses/${a.house_no}_${ts}.jpg`;
      const photoUrl = await uploadToSupabase(filePath, file);

      const caption = `🏠 *${a.house_no} ${a.street_name} (${a.block})*\n👮 ${guardName}\n🏍️ ${plateNo}\n📍 ${coords}\n🕓 ${new Date().toLocaleString()}`;
      await sendTelegramPhoto(photoUrl, caption);

      toast.success("✅ Photo sent to Telegram!");
      setDoneIds((p) => [...p, a.id]);
    } catch (err) {
      console.error("Snap error:", err.message);
      toast.error("❌ Upload failed");
    } finally {
      setLoading(false);
      uploadingRef.current.delete(a.id);
    }
  };

  // ✅ Camera control (selfie)
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
      toast.error("Camera not accessible.");
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

    const coords = guardPos ? `${guardPos[0]},${guardPos[1]}` : "No GPS";
    const caption =
      selfieType === "selfieIn"
        ? `🚨 Guard On Duty\n👮 ${guardName}\n🏍️ ${plateNo}\n📍 ${coords}\n🕓 ${new Date().toLocaleString()}`
        : `✅ Patrol Ended\n👮 ${guardName}\n🏍️ ${plateNo}\n📍 ${coords}\n🕓 ${new Date().toLocaleString()}`;
    await sendTelegramPhoto(photoUrl, caption);

    setShowCamera(false);
    if (selfieType === "selfieOut") {
      closeGuardChannel();
      toast.success("✅ Patrol Ended");
      setTimeout(() => navigate("/guard/dashboard"), 600);
    }
  };

  // ✅ Group houses by session
  const grouped = assignments.reduce((acc, a) => {
    const s = a.session_no || 0;
    if (!acc[s]) acc[s] = [];
    acc[s].push(a);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#f7faff] p-4 space-y-4 pb-16">
      <h1 className="text-2xl font-bold text-[#0B132B]">Guard Routes</h1>

      {/* Registration */}
      {!registered && (
        <div className="bg-white p-4 rounded-xl shadow">
          <input
            placeholder="Guard Name"
            value={guardName}
            onChange={(e) => setGuardName(e.target.value)}
            className="border p-2 rounded w-full mb-2"
          />
          <input
            placeholder="Plate Number"
            value={plateNo}
            onChange={(e) => setPlateNo(e.target.value)}
            className="border p-2 rounded w-full mb-3"
          />
          <button
            onClick={() => {
              if (!guardName) return toast.error("Please enter your name");
              setRegistered(true);
              localStorage.setItem("guardName", guardName);
              localStorage.setItem("plateNo", plateNo);
              localStorage.setItem("registered", "true");
              toast.success("✅ Registered");
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded w-full"
          >
            Save
          </button>
        </div>
      )}

      {/* Active Patrol View */}
      {registered && (
        <>
          <div className="flex gap-2">
            <button
              onClick={() => openCamera("selfieIn")}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              Selfie IN
            </button>
            <button
              onClick={() => openCamera("selfieOut")}
              className="bg-rose-600 text-white px-4 py-2 rounded"
            >
              Selfie OUT
            </button>
          </div>

          <div className="h-[360px] rounded-xl overflow-hidden shadow bg-white mt-3">
            <MapContainer
              center={guardPos || [5.65, 100.5]}
              zoom={16}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapCenter center={guardPos} />
              <PolylineTracker
                center={guardPos}
                polylineRef={polylineRef}
                coordsRef={coordsRef}
              />
              {guardPos && (
                <Marker position={guardPos}>
                  <Popup>{guardName || "Guard Active"}</Popup>
                </Marker>
              )}
              {assignments.map((a) => (
                <Marker key={a.id} position={[a.lat || 0, a.lng || 0]}>
                  <Popup>
                    {a.house_no} {a.street_name} ({a.block})
                    <br />
                    {doneIds.includes(a.id) ? (
                      <button
                        disabled
                        className="bg-green-500 text-white px-2 py-1 text-xs rounded mt-2"
                      >
                        ✅ Done
                      </button>
                    ) : (
                      <label className="bg-blue-500 text-white px-2 py-1 text-xs rounded mt-2 cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          hidden
                          onChange={(e) => handleSnap(e.target.files[0], a)}
                        />
                        📸 Snap
                      </label>
                    )}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {/* Session List */}
          <div className="bg-white p-4 rounded-xl shadow mt-3">
            <h3 className="font-semibold mb-2">🏠 Assigned Houses</h3>
            {Object.keys(grouped).map((s) => (
              <div key={s} className="mb-3">
                <h4 className="font-semibold mb-1">Session {s}</h4>
                {grouped[s].map((a) => (
                  <div
                    key={a.id}
                    className="flex justify-between border-b py-1 text-sm"
                  >
                    <span>
                      {a.house_no} {a.street_name} ({a.block})
                    </span>
                    {doneIds.includes(a.id) ? (
                      <span className="text-green-600">✅ Done</span>
                    ) : (
                      <label className="cursor-pointer text-blue-600">
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          hidden
                          onChange={(e) => handleSnap(e.target.files[0], a)}
                        />
                        📸 Snap
                      </label>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Selfie Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999]">
          <div className="bg-white p-4 rounded-xl shadow-lg w-[420px]">
            <video
              ref={videoRef}
              width="400"
              height="300"
              autoPlay
              playsInline
              className="rounded-md"
            />
            <canvas ref={canvasRef} width="400" height="300" hidden />
            <div className="mt-2 flex gap-2">
              <button
                onClick={captureSelfie}
                className="bg-blue-600 text-white py-2 rounded w-full"
              >
                Capture
              </button>
              <button
                onClick={() => setShowCamera(false)}
                className="bg-gray-400 text-black py-2 rounded w-full"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Uploading overlay */}
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
