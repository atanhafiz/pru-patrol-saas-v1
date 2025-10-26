// ✅ AHE SmartPatrol v2.9 — Assigned Houses Restored
// Restores Assigned Houses list under map, keeps clean registration logic.

import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { getGuardChannel, closeGuardChannel } from "../../lib/guardChannel";
import { sendTelegramPhoto, sendTelegramMessage } from "../../lib/telegram";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Loader2 } from "lucide-react";
import GuardBottomNav from "../../components/GuardBottomNav";
import toast from "react-hot-toast";
import "leaflet/dist/leaflet.css";

let gpsWatchId = null;

// --- Helper: validate input ---------------------------------------------------
const isValidGuardValue = (v) => {
  if (!v) return false;
  const s = String(v).trim().toLowerCase();
  const bad = ["", "unknown", "guard amir", "guardamir", "guard"];
  return !bad.includes(s);
};

// --- Map Helpers --------------------------------------------------------------
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
      polylineRef.current = L.polyline(coordsRef.current, {
        color: "#00b300",
        weight: 4,
        opacity: 0.8,
      }).addTo(map);
    } else polylineRef.current.addLatLng(center);
  }, [center, map]);
  return null;
}

// --- Main ---------------------------------------------------------------------
export default function RouteList() {
  const navigate = useNavigate();
  const location = useLocation();

  const storedName = localStorage.getItem("guardName");
  const storedPlate = localStorage.getItem("plateNo");
  const nameOK = isValidGuardValue(storedName);
  const plateOK = isValidGuardValue(storedPlate);

  const [assignments, setAssignments] = useState([]);
  const [doneIds, setDoneIds] = useState([]);
  const [guardPos, setGuardPos] = useState(null);
  const [guardName, setGuardName] = useState(nameOK ? storedName : "");
  const [plateNo, setPlateNo] = useState(plateOK ? storedPlate : "");
  const [registered, setRegistered] = useState(
    nameOK && plateOK && localStorage.getItem("registered") === "true"
  );
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [selfieType, setSelfieType] = useState(null);
  const [allowSelfieOutNav, setAllowSelfieOutNav] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const uploadingRef = useRef(new Set());
  const polylineRef = useRef(null);
  const coordsRef = useRef([]);
  const blockNavRef = useRef(true);

  // --- Clean invalid saved data on mount --------------------------------------
  useEffect(() => {
    if (!isValidGuardValue(localStorage.getItem("guardName"))) {
      localStorage.removeItem("guardName");
    }
    if (!isValidGuardValue(localStorage.getItem("plateNo"))) {
      localStorage.removeItem("plateNo");
    }
    if (
      !isValidGuardValue(localStorage.getItem("guardName")) ||
      !isValidGuardValue(localStorage.getItem("plateNo"))
    ) {
      localStorage.removeItem("registered");
      setRegistered(false);
    }
  }, []);

  // --- Fetch assignments ------------------------------------------------------
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("patrol_assignments")
        .select("*")
        .eq("status", "pending")
        .order("created_at");

      if (error) {
        console.error("❌ Fetch assignments error:", error.message);
        toast.error("Failed to load assignments");
      } else {
        setAssignments(data || []);
      }
    })();
  }, []);

  // --- GPS Tracking -----------------------------------------------------------
  useEffect(() => {
    if (!navigator.geolocation) return;
    gpsWatchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        if (accuracy > 15) return;
        setGuardPos([latitude, longitude]);
        try {
          getGuardChannel().send({
            type: "broadcast",
            event: "location_update",
            payload: {
              lat: latitude,
              lng: longitude,
              name: guardName || "Guard",
              status: "Patrolling",
            },
          });
        } catch {}
      },
      (e) => console.warn("GPS error:", e.message),
      { enableHighAccuracy: true }
    );
    return () => gpsWatchId && navigator.geolocation.clearWatch(gpsWatchId);
  }, [guardName]);

  // --- Upload helper ----------------------------------------------------------
  const uploadToSupabase = async (path, blob) => {
    const { error } = await supabase.storage
      .from("patrol-photos")
      .upload(path, blob, { upsert: true });
    if (error) throw error;
    return supabase.storage.from("patrol-photos").getPublicUrl(path).data.publicUrl;
  };

  // --- Handle Snap ------------------------------------------------------------
  const handleSnap = useCallback(
    async (file, assignment) => {
      if (!file || uploadingRef.current.has(assignment.id)) return;
      uploadingRef.current.add(assignment.id);
      setLoading(true);
      try {
        const ts = Date.now();
        const coords = guardPos ? `${guardPos[0]},${guardPos[1]}` : "No GPS";
        const path = `houses/${assignment.house_no}_${ts}.jpg`;
        const url = await uploadToSupabase(path, file);

        await sendTelegramPhoto(
          url,
          `🏠 *${assignment.house_no} ${assignment.street_name} (${assignment.block})*\n👮 ${guardName}\n🏍️ ${plateNo}\n📍 ${coords}\n🕓 ${new Date().toLocaleString()}`
        );

        setDoneIds((prev) => [...new Set([...prev, assignment.id])]);
        toast.success(`✅ ${assignment.house_no} uploaded successfully`);
      } catch (e) {
        toast.error("Upload failed: " + e.message);
      } finally {
        setLoading(false);
        uploadingRef.current.delete(assignment.id);
      }
    },
    [guardPos, guardName, plateNo]
  );

  // --- Auto Telegram Summary --------------------------------------------------
  useEffect(() => {
    if (!assignments.length) return;
    const grouped = assignments.reduce((a, r) => {
      (a[r.session_no || 0] ||= []).push(r);
      return a;
    }, {});
    Object.keys(grouped).forEach(async (sessionNo) => {
      const houses = grouped[sessionNo];
      const total = houses.length;
      const doneCount = houses.filter((h) => doneIds.includes(h.id)).length;
      if (total > 0 && total === doneCount) {
        if (!sessionStorage.getItem(`summarySent_${sessionNo}`)) {
          sessionStorage.setItem(`summarySent_${sessionNo}`, "true");
          const msg = `🧾 *Patrol Summary*
👮 ${guardName}
🏍️ ${plateNo}
🏘️ Session ${sessionNo}
✅ Houses Done: ${total}/${total}
📍 Prima Residensi Utama
🕓 ${new Date().toLocaleString()}`;
          await sendTelegramMessage(msg);
          toast.success(`📨 Session ${sessionNo} report sent`);
        }
      }
    });
  }, [doneIds]);

  // --- Camera & Selfie --------------------------------------------------------
  const openCamera = async (t) => {
    setSelfieType(t);
    setShowCamera(true);
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      videoRef.current.srcObject = s;
      videoRef.current.style.transform = "scaleX(-1)";
      await videoRef.current.play();
    } catch {
      toast.error("Camera not accessible");
      setShowCamera(false);
    }
  };

  const captureSelfie = async () => {
    try {
      setLoading(true);
      toast.loading("Uploading selfie...");
  
      const c = canvasRef.current;
      const x = c.getContext("2d");
      x.translate(c.width, 0);
      x.scale(-1, 1);
      x.drawImage(videoRef.current, 0, 0, 400, 300);
      const blob = await (await fetch(c.toDataURL("image/jpeg"))).blob();
      const ts = Date.now();
      const path = `selfies/${guardName}_${selfieType}_${ts}.jpg`;
      const url = await uploadToSupabase(path, blob);
      const coords = guardPos ? `${guardPos[0]},${guardPos[1]}` : "No GPS";
  
      const caption =
        selfieType === "selfieIn"
          ? `🚨 Guard to START PATROL \n👮 ${guardName}\n🏍️ ${plateNo}\n📍 ${coords}`
          : `✅ PATROL ENDED\n👮 ${guardName}\n🏍️ ${plateNo}\n📍 ${coords}`;
  
      await sendTelegramPhoto(url, caption);
  
      toast.dismiss();
      toast.success("✅ Selfie sent to Telegram!");
      setShowCamera(false);
  
      // 🔥 tambahan bahagian selfieOut
      if (selfieType === "selfieOut") {
        closeGuardChannel();
        toast.success("✅ Patrol Ended — returning to Dashboard...");
        ["guardName", "plateNo", "registered"].forEach((k) =>
          localStorage.removeItem(k)
        );
        sessionStorage.removeItem("stayOnRoute");
        blockNavRef.current = false;
        setAllowSelfieOutNav(true);
  
        setTimeout(() => {
          navigate("/guard/dashboard");
        }, 1200);
      }
    } catch (err) {
      toast.dismiss();
      console.error("Selfie upload error:", err.message);
      toast.error("❌ Failed to send selfie. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  // --- Group Assignments ------------------------------------------------------
  const grouped = assignments.reduce((a, r) => {
    (a[r.session_no || 0] ||= []).push(r);
    return a;
  }, {});

// --- UI ---------------------------------------------------------------------
return (
  <>
    <div className="min-h-screen bg-[#f7faff] p-4 space-y-4 pb-16">
      <h1 className="text-2xl font-bold text-[#0B132B]">Guard Routes</h1>

      {!registered ? (
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
              const name = guardName.trim();
              const plate = plateNo.trim();
              if (!isValidGuardValue(name) || !isValidGuardValue(plate)) {
                return toast.error("Please enter valid name & plate number");
              }
              setRegistered(true);
              localStorage.setItem("guardName", name);
              localStorage.setItem("plateNo", plate);
              localStorage.setItem("registered", "true");
              toast.success("✅ Registered");
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded w-full"
          >
            Save
          </button>
        </div>
      ) : (
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

          {/* Map Section */}
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
                  <Popup>{guardName}</Popup>
                </Marker>
              )}
              {assignments.map((a) => (
                <Marker key={a.id} position={[a.lat || 0, a.lng || 0]}>
                  <Popup>
                    {a.house_no} {a.street_name} ({a.block})<br />
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
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) handleSnap(file, a);
                            e.target.value = "";
                          }}
                        />
                        📸 Snap
                      </label>
                    )}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {/* 🏘️ Assigned Houses (Final Polished v3.5) */}
          <div className="bg-white/95 backdrop-blur-sm p-6 rounded-2xl shadow-md border border-gray-100 mt-4">
            <div className="flex items-center gap-2 mb-5">
              <span className="text-2xl">🏠</span>
              <h3 className="text-lg font-semibold text-[#0B132B] tracking-tight">
                Assigned Houses
              </h3>
            </div>

            {Object.keys(grouped).length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-3">
                No assigned houses yet.
              </p>
            ) : (
              Object.keys(grouped).map((s) => (
                <div key={s} className="border-l-4 border-blue-500 pl-3 mb-6">
                  {/* Session label */}
                  <h4 className="inline-block px-3 py-1 mb-3 text-xs font-bold text-white bg-blue-600 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.4)] uppercase tracking-wide">
                    Session {s}
                  </h4>

                  {/* Houses list */}
                  <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                    {grouped[s].map((a, idx) => (
                      <div
                        key={a.id}
                        className={`flex justify-between items-center py-3 px-4 ${
                          idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                        } hover:bg-blue-50 transition-all duration-200`}
                      >
                        {/* House info */}
                        <div className="text-[14px] text-gray-800 font-medium leading-snug">
                          {a.house_no} {a.street_name}{" "}
                          <span className="text-gray-500 font-normal">
                            ({a.block})
                          </span>
                        </div>

                        {/* Action buttons */}
                        {doneIds.includes(a.id) ? (
                          <div className="flex items-center gap-1 text-green-600 font-semibold text-sm">
                            <span>✅</span> Done
                          </div>
                        ) : (
                          <label className="flex items-center gap-1 text-blue-600 font-semibold text-sm cursor-pointer hover:text-blue-800 active:scale-95 transition-all">
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              hidden
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) handleSnap(file, a);
                                e.target.value = "";
                              }}
                            />
                            {/* Camera icon */}
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                              className="w-4 h-4"
                            >
                              <path d="M12 5c-3.86 0-7 3.14-7 7 0 1.63.56 3.13 1.5 4.32L5 19l2.68-1.5C8.87 18.44 10.37 19 12 19c3.86 0 7-3.14 7-7s-3.14-7-7-7zM9 12c0-1.66 1.34-3 3-3s3 1.34 3 3-1.34 3-3 3-3-1.34-3-3z" />
                            </svg>
                            Snap
                          </label>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Camera Modal & Loader same as before */}
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
  </>
  );
}
