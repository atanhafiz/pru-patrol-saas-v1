// AHE SmartPatrol Hybrid Stable (Fixed Stay-in-Page Mode + Snap→Done)
// RouteList.jsx – Guard stays on page after snap until selfie OUT

import { useEffect, useState, useRef } from "react";
import { supabase } from "../../lib/supabaseClient";
import { sendTelegramPhoto } from "../../shared/api/telegram";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Camera, Loader2 } from "lucide-react";
import GuardBottomNav from "../../components/GuardBottomNav";
import toast from "react-hot-toast";

// Component to handle map centering
function MapCenter({ center, zoom }) {
  const map = useMap();
  
  useEffect(() => {
    if (center && center[0] && center[1]) {
      const zoomLevel = zoom || 18;
      map.flyTo(center, zoomLevel, {
        animate: true,
        duration: 1.5, // smooth transition ~1.5s
        easeLinearity: 0.25,
      });
      console.log("🌀 flyTo animation:", center[0], center[1]);
    }
  }, [center, zoom, map]);
  
  return null;
}

export default function RouteList() {
  const [assignments, setAssignments] = useState([]);
  const [guardName, setGuardName] = useState(localStorage.getItem("guardName") || "");
  const [plateNo, setPlateNo] = useState(localStorage.getItem("plateNo") || "");
  const [registered, setRegistered] = useState(localStorage.getItem("registered") === "true");
  const [guardPos, setGuardPos] = useState(null);
  const [loading, setLoading] = useState(false);

  const [showCamera, setShowCamera] = useState(false);
  const [selfieType, setSelfieType] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // ✅ New state to mark house as done
  const [doneHouseIds, setDoneHouseIds] = useState([]);

  // 🛰️ GPS & Assignments
  useEffect(() => {
    fetchAssignments();
    
    // Set up GPS tracking and realtime broadcasting
    const channel = supabase.channel("guard_location");
    channel.subscribe();
    console.log("🛰️ GUARD: channel subscribed guard_location");
    
    const watch = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setGuardPos([lat, lng]);
        
        // Broadcast GPS location to admin
        channel.send({
          type: "broadcast",
          event: "location_update",
          payload: { 
            lat, 
            lng, 
            id: 1, // Guard ID
            name: guardName || "Guard",
            status: "Patrolling"
          }
        });
        console.log("🛰️ GUARD: location broadcasted", { lat, lng, guardName });
      },
      (err) => console.error("GPS error:", err),
      { enableHighAccuracy: true }
    );
    
    return () => {
      navigator.geolocation.clearWatch(watch);
      supabase.removeChannel(channel);
    };
  }, [guardName]);

  const fetchAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from("patrol_assignments")
        .select("*")
        .order("session_no", { ascending: true });
      if (error) throw error;
      setAssignments(data || []);
    } catch (err) {
      console.error("Fetch assignment error:", err);
      toast.error("Failed to load assignments");
    }
  };

  // 📤 Upload ke Supabase
  const uploadToSupabase = async (filePath, blob) => {
    const { error: upErr } = await supabase.storage
      .from("patrol-photos")
      .upload(filePath, blob, { contentType: "image/jpeg", upsert: true });
    if (upErr) throw upErr;
    const { data } = await supabase.storage
      .from("patrol-photos")
      .getPublicUrl(filePath);
    return data.publicUrl;
  };

  // 📸 Selfie Modal
  const openSelfie = async (type) => {
    try {
      setSelfieType(type);
      setShowCamera(true);
      const facing =
        type === "selfieIn" || type === "selfieOut" ? "user" : "environment";
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facing } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.playsInline = true;
        await videoRef.current.play();
        videoRef.current.streamRef = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      toast.error("Camera not accessible. Please allow permission again.");
      setShowCamera(false);
    }
  };

  const captureSelfie = async () => {
    try {
      if (!videoRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(videoRef.current, 0, 0, 400, 300);
      const dataUrl = canvas.toDataURL("image/jpeg");

      const stream = videoRef.current.streamRef;
      if (stream) stream.getTracks().forEach((t) => t.stop());
      setShowCamera(false);
      setLoading(true);

      const ts = Date.now();
      const filePath = `selfies/${guardName}_${plateNo}_${selfieType}_${ts}.jpg`;
      const blob = await fetch(dataUrl).then((r) => r.blob());
      const photoUrl = await uploadToSupabase(filePath, blob);

      const coords = guardPos ? `${guardPos[0]},${guardPos[1]}` : "No GPS";
      const caption =
        selfieType === "selfieIn"
          ? `🚨 *Guard On Duty*\n👤 ${guardName}\n🏍️ ${plateNo}\n📍 ${coords}\n🕓 ${new Date().toLocaleString()}`
          : `✅ *Patrol Ended*\n👤 ${guardName}\n🏍️ ${plateNo}\n📍 ${coords}\n🕓 ${new Date().toLocaleString()}`;
      await sendTelegramPhoto(photoUrl, caption);

      toast.success("✅ Selfie sent!");
      if (selfieType === "selfieOut") {
        localStorage.removeItem("guardName");
        localStorage.removeItem("plateNo");
        localStorage.removeItem("registered");
        setRegistered(false);
        setGuardName("");
        setPlateNo("");
      }
    } catch (err) {
      console.error("Selfie error:", err);
      toast.error("Failed to send selfie.");
    } finally {
      setLoading(false);
    }
  };

  // 🏠 Snap Rumah (Stay-in-Page + mark Done)
  const handleUploadFile = async (file, assignment) => {
    try {
      setLoading(true);
      const ts = Date.now();
      const coords = guardPos ? `${guardPos[0]},${guardPos[1]}` : "No GPS";
      const blob = file;
      const { id, house_no, street_name, block } = assignment || {};
      const filePath = `houses/${house_no}_${plateNo}_${ts}.jpg`;
      const photoUrl = await uploadToSupabase(filePath, blob);

      const caption = `🏠 *${house_no} ${street_name} (${block})*\n👤 ${guardName}\n🏍️ ${plateNo}\n📍 ${coords}\n🕓 ${new Date().toLocaleString()}`;
      await sendTelegramPhoto(photoUrl, caption);

      toast.success("✅ Sent to Telegram!");

      // ✅ Mark house as done (replace Snap with Done)
      setDoneHouseIds((prev) => [...prev, id]);

      await fetchAssignments();
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("❌ Upload failed: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const groupedAssignments = assignments.reduce((acc, a) => {
    const session = a.session_no || 0;
    if (!acc[session]) acc[session] = [];
    acc[session].push(a);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7faff] via-white to-[#edf3ff] p-4 sm:p-6 space-y-4 sm:space-y-6 pb-16">
      <h1 className="text-2xl font-bold text-[#0B132B]">Routes</h1>

      {/* REGISTER FORM */}
      {!registered && (
        <div className="bg-white/90 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 p-4 sm:p-6 max-w-md mb-4">
          <h3 className="font-semibold text-[#0B132B] mb-2">Register Guard</h3>
          <input
            placeholder="Guard Name"
            value={guardName}
            onChange={(e) => setGuardName(e.target.value)}
            className="border border-gray-200 p-3 rounded-xl w-full mb-3 focus:ring-2 focus:ring-blue-500"
          />
          <input
            placeholder="Plate Number"
            value={plateNo}
            onChange={(e) => setPlateNo(e.target.value)}
            className="border border-gray-200 p-3 rounded-xl w-full mb-4 focus:ring-2 focus:ring-blue-500"
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
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-xl w-full shadow-md hover:shadow-lg transition"
          >
            Save
          </button>
        </div>
      )}

      {registered && (
        <>
          {/* Selfie Buttons */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => openSelfie("selfieIn")}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-md hover:shadow-lg transition"
            >
              <Camera className="w-4 h-4" /> Selfie IN
            </button>
            <button
              onClick={() => openSelfie("selfieOut")}
              className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-md hover:shadow-lg transition"
            >
              <Camera className="w-4 h-4" /> Selfie OUT
            </button>
          </div>

          {/* Map Section */}
          <div className="h-[360px] w-full rounded-2xl overflow-hidden shadow-md border border-gray-200 bg-white relative z-0">
            <MapContainer
              center={guardPos || [5.65, 100.5]}
              zoom={16}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap"
              />
              <MapCenter center={guardPos} zoom={18} />
              {guardPos && (
                <Marker 
                  position={guardPos}
                  eventHandlers={{
                    add: (e) => {
                      // Highlight marker when added
                      e.target.setZIndexOffset(1000);
                      e.target.bindPopup(`<b>${guardName || "Guard Active"}</b>`).openPopup();
                    }
                  }}
                >
                  <Popup>
                    <b>{guardName || "Guard Active"}</b><br/>
                    {plateNo && `Plate: ${plateNo}`}
                  </Popup>
                </Marker>
              )}
              {assignments.map((a) => (
                <Marker key={a.id} position={[a.lat || 0, a.lng || 0]}>
                  <Popup>
                    {a.house_no} {a.street_name} ({a.block}) — Session {a.session_no}
                    <br />
                    {doneHouseIds.includes(a.id) ? (
                      <button
                        disabled
                        className="bg-green-500 text-white rounded px-2 py-1 mt-2 text-xs cursor-default"
                      >
                        ✅ Done
                      </button>
                    ) : (
                      <label className="bg-blue-500 text-white rounded px-2 py-1 mt-2 cursor-pointer text-xs">
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          hidden
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) handleUploadFile(file, a);
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

          {/* List by Session */}
          <div className="bg-white/90 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 mt-4 p-4 sm:p-6 text-sm">
            <h3 className="font-semibold text-[#0B132B] mb-3">🏠 Assigned Houses</h3>
            {Object.keys(groupedAssignments).map((session) => (
              <div key={session} className="mb-3">
                <h4 className="font-semibold text-[#0B132B] mb-2">
                  Session {session}
                </h4>
                <ul className="space-y-2">
                  {groupedAssignments[session].map((a) => (
                    <li
                      key={a.id}
                      className="flex justify-between items-center bg-gray-50 p-3 rounded-xl"
                    >
                      <span>
                        {a.house_no} {a.street_name} ({a.block})
                      </span>
                      {doneHouseIds.includes(a.id) ? (
                        <button
                          disabled
                          className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg px-3 py-1 text-xs cursor-default"
                        >
                          ✅ Done
                        </button>
                      ) : (
                        <label className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg px-3 py-1 text-xs cursor-pointer shadow-sm hover:shadow-md transition">
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            hidden
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) handleUploadFile(file, a);
                            }}
                          />
                          Snap
                        </label>
                      )}
                    </li>
                  ))}
                </ul>
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
            <button
              onClick={captureSelfie}
              className="w-full bg-accent text-white py-2 rounded-lg mt-3"
            >
              Capture
            </button>
            <button
              onClick={() => {
                if (videoRef.current?.streamRef) {
                  videoRef.current.streamRef.getTracks().forEach((t) => t.stop());
                }
                setShowCamera(false);
              }}
              className="w-full bg-gray-300 text-black py-2 rounded-lg mt-2"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999]">
          <div className="bg-white p-5 rounded-xl flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-accent" />
            <p>Uploading...</p>
          </div>
        </div>
      )}

      <GuardBottomNav />
    </div>
  );
}
