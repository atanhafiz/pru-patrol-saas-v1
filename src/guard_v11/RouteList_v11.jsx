// PRU Patrol Sandbox v1.1 – RouteList_v11.jsx
import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { sendTelegramPhoto } from "../shared_v11/api/telegram";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Camera, Loader2 } from "lucide-react";
import GuardBottomNav from "../components/GuardBottomNav";

// Haversine function to calculate distance between two coordinates
const haversine = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
};

export default function RouteList_v11() {
  const [assignments, setAssignments] = useState([]);
  // guardName & plateNo are editable inputs; registration state is controlled by `registered`
// guard wajib register setiap kali buka route page
const [guardName, setGuardName] = useState("");
const [plateNo, setPlateNo] = useState("");
const [registered, setRegistered] = useState(false);

  const [guardPos, setGuardPos] = useState(null);
  const [mode, setMode] = useState(null); // "selfieIn" | "selfieOut" | "house"
  const [targetHouse, setTargetHouse] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  // Track location history for speed calculation
  const lastLocationRef = useRef(null);
  const lastTimeRef = useRef(null);

  // ---------- FETCH ASSIGNMENTS ----------
  const fetchAssignments = async () => {
    const { data, error } = await supabase
      .from("patrol_assignments")
      .select("*")
      .order("session_no", { ascending: true });
    if (!error) setAssignments(data || []);
  };

  // ---------- GPS WATCH ----------
  useEffect(() => {
    fetchAssignments();
    const watch = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const currentTime = Date.now();
        
        setGuardPos([latitude, longitude]);
        updateLocation(latitude, longitude);
        
        // Calculate speed if we have previous location data
        let speed = 0;
        if (lastLocationRef.current && lastTimeRef.current) {
          const distance = haversine(
            lastLocationRef.current.lat,
            lastLocationRef.current.lng,
            latitude,
            longitude
          );
          const timeDiff = (currentTime - lastTimeRef.current) / 1000 / 3600; // hours
          if (timeDiff > 0) {
            speed = distance / timeDiff; // km/h
          }
        }
        
        // Update location tracking with speed
        updateLocationTrack(latitude, longitude, speed);
        
        // Send speed alert if speed exceeds 50 km/h
        if (speed > 50) {
          try {
            await sendTelegramPhoto(
              "",
              `⚠️ SPEED ALERT!\n👤 ${guardName}\n🏍️ ${plateNo}\n📍 ${latitude},${longitude}\n🚀 Speed: ${speed.toFixed(1)} km/h`
            );
            console.log("Speed alert sent successfully");
          } catch (err) {
            console.error("Failed to send speed alert:", err);
          }
        }
        
        // Store current location and time for next calculation
        lastLocationRef.current = { lat: latitude, lng: longitude };
        lastTimeRef.current = currentTime;
      },
      (err) => console.error("GPS error:", err),
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateLocation = async (lat, lng) => {
    // update only if registered
    if (!registered) return;
    try {
      await supabase
        .from("guard_locations")
        .upsert({
          guard_name: guardName || "-",
          plate_no: plateNo || "-",
          lat,
          lng,
          updated_at: new Date(),
        });
    } catch (err) {
      console.error("updateLocation error:", err);
    }
  };

  const updateLocationTrack = async (lat, lng, speed = 0) => {
    // update only if registered
    if (!registered) return;
    try {
      await supabase
        .from("guard_tracks")
        .insert({
          guard_name: guardName || "-",
          lat,
          lng,
          speed,
        });
    } catch (err) {
      console.error("updateLocationTrack error:", err);
    }
  };

  // 🧾 Utility function to log event
  const logActivity = async (type, description) => {
    try {
      await supabase.from("activity_log").insert({
        type,
        description,
        guard_name: guardName || "-",
        time: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Activity log error:", err.message);
    }
  };

  // 🧹 Function to clear today's completed routes + send Telegram alert
  const clearTodaySession = async () => {
    if (!confirm("Clear today's completed routes?")) return;
    const today = new Date().toISOString().split("T")[0];
    const { error } = await supabase
      .from("patrol_assignments")
      .delete()
      .eq("status", "completed")
      .gte("created_at", today + "T00:00:00.000Z");

    if (error) {
      alert("❌ Failed to clear: " + error.message);
    } else {
      alert("✅ Today's session cleared!");
      fetchAssignments();

      // 🧾 Send Telegram alert to admin
      try {
        const caption = `🧹 Patrol Session Cleared\n👤 Guard: ${guardName}\n🏍️ Plate: ${plateNo}\n📅 Date: ${new Date().toLocaleDateString()}\n✅ Status: All tasks completed.`;
        const dummyImage = "https://upload.wikimedia.org/wikipedia/commons/8/84/Example.svg"; // Telegram requires an image URL
        await sendTelegramPhoto(dummyImage, caption);
      } catch (err) {
        console.error("Telegram alert failed:", err.message);
      }
    }
  };

  // 🧩 Determine if all tasks are completed (for today)
  const allCompletedToday = assignments.length > 0 && assignments.every((a) => {
    const createdDate = new Date(a.created_at).toISOString().split("T")[0];
    const today = new Date().toISOString().split("T")[0];
    return a.status === "completed" && createdDate === today;
  });

  // ---------- REGISTER (Guard name sama kaedah macam plate) ----------
  const handleRegister = () => {
    const name = guardName.trim() || "-";
    const plate = plateNo.trim() || "-";
  
    // ✅ tak simpan ke localStorage — guard wajib isi setiap kali buka
    setRegistered(true);
    alert("✅ Registered successfully!");
  };
  
  const handleResetRegistration = () => {
    localStorage.removeItem("guardName");
    localStorage.removeItem("plateNo");
    setGuardName("");
    setPlateNo("");
    setRegistered(false);
  };

  // ---------- CAMERA ----------
  const openCamera = async (type, house = null) => {
    setMode(type);
    setTargetHouse(house);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error("openCamera error:", err);
      alert("Camera not accessible.");
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    stream?.getTracks()?.forEach((t) => t.stop());
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, 400, 300);
    const dataUrl = canvasRef.current.toDataURL("image/jpeg");
    setPhotoPreview(dataUrl);
    stopCamera(); // auto stop kamera selepas capture
  };

  // ---------- UPLOAD HELPERS ----------
  const dataURLtoBlob = (dataurl) => {
    const arr = dataurl.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    const u8arr = new Uint8Array(bstr.length);
    for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
    return new Blob([u8arr], { type: mime });
  };

  const uploadToSupabase = async (filePath, dataUrl) => {
    // upsert true not always available in older clients; using overwrite via upload + upsert param
    const blob = dataURLtoBlob(dataUrl);
    const { error: upErr } = await supabase.storage
      .from("patrol-photos")
      .upload(filePath, blob, { contentType: "image/jpeg", upsert: true });
    if (upErr) throw upErr;
    const { data } = await supabase.storage.from("patrol-photos").getPublicUrl(filePath);
    return data.publicUrl;
  };

  // ---------- HANDLE UPLOAD ----------
  const handleUpload = async () => {
    if (!photoPreview || !mode) return;
    setLoading(true);
    try {
      const ts = Date.now();
      const coords = guardPos ? `${guardPos[0]},${guardPos[1]}` : "No GPS";
      let photoUrl = "";
      let caption = "";

      if (mode === "selfieIn" || mode === "selfieOut") {
        const folder = mode === "selfieIn" ? "selfies/in" : "selfies/out";
        const filePath = `${folder}/${(guardName || "-")}_${(plateNo || "-")}_${ts}.jpg`;
        photoUrl = await uploadToSupabase(filePath, photoPreview);
        caption =
          mode === "selfieIn"
            ? `🚨 Guard On Duty\n👤 ${guardName}\n🏍️ ${plateNo}\n📍 ${coords}\n🕓 ${new Date().toLocaleString()}`
            : `✅ Guard Off Duty\n👤 ${guardName}\n🏍️ ${plateNo}\n📍 ${coords}\n🕓 ${new Date().toLocaleString()}`;
        
        // Log selfie action
        if (mode === "selfieIn") {
          await logActivity("checkin", `Started patrol at Prima Residensi Utama`);
        } else if (mode === "selfieOut") {
          await logActivity("checkout", `Completed patrol at Prima Residensi Utama`);
        }
      } else if (mode === "house" && targetHouse) {
        const filePath = `houses/${(guardName || "-")}_${targetHouse.house_no}_${ts}.jpg`;
        photoUrl = await uploadToSupabase(filePath, photoPreview);
        caption = `📸 Patrol Proof\n👤 ${guardName}\n🏍️ ${plateNo}\n🏠 ${targetHouse.house_no} ${targetHouse.street_name} (${targetHouse.block})\n📍 ${coords}\n🕓 ${new Date().toLocaleString()}`;
        // update assignment row (ensure RLS disabled or policy exists)
        await supabase.from("patrol_assignments").update({ photo_url: photoUrl, status: "completed" }).eq("id", targetHouse.id);
        
        // Log house patrol action
        await logActivity("patrol", `Route completed at Prima Residensi Utama (${targetHouse.house_no})`);
      }

      // send to telegram
      await sendTelegramPhoto(photoUrl, caption);

      alert("✅ Uploaded & sent to Telegram!");
      setPhotoPreview(null);
      setMode(null);
      setTargetHouse(null);
      fetchAssignments();
    } catch (err) {
      console.error("handleUpload:", err);
      alert("❌ Upload failed: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  // ---------- UI ----------
  return (
    <div className="p-5 space-y-5 pb-16">
      <h1 className="text-2xl font-bold text-primary">Guard Dashboard v1.1</h1>

      {/* REGISTER FORM */}
      {!registered ? (
        <div className="bg-white p-4 rounded-xl shadow max-w-md">
          <h3 className="font-semibold mb-2">Register Guard</h3>

          <label className="text-xs text-gray-500">Name (any input accepted)</label>
          <input
            placeholder="Guard Name"
            value={guardName}
            onChange={(e) => setGuardName(e.target.value)}
            className="border p-2 rounded w-full mb-2"
          />

          <label className="text-xs text-gray-500">Plate Number (optional)</label>
          <input
            placeholder="Plate Number"
            value={plateNo}
            onChange={(e) => setPlateNo(e.target.value)}
            className="border p-2 rounded w-full mb-3"
          />

          <div className="flex gap-2">
            <button
              onClick={handleRegister}
              className="bg-accent text-white px-4 py-2 rounded flex-1"
            >
              Save
            </button>
            <button
  onClick={() => {
    setGuardName("");
    setPlateNo("");
    setRegistered(false);
  }}
  className="text-xs text-gray-500 underline mt-2"
>
  Reset Registration
</button>
          </div>
        </div>
      ) : (
        <>
          {/* SELFIE BUTTONS */}
          <div className="flex gap-2">
            <button onClick={() => openCamera("selfieIn")} className="bg-green-500 text-white px-4 py-2 rounded">
              Selfie IN
            </button>
            <button onClick={() => openCamera("selfieOut")} className="bg-red-500 text-white px-4 py-2 rounded">
              Selfie OUT
            </button>
          </div>

          {/* Clear Today's Session Button */}
          {allCompletedToday && (
            <div className="flex gap-2 mt-2">
              <button
                onClick={clearTodaySession}
                className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded"
              >
                🧹 Clear Today's Session
              </button>
            </div>
          )}

          {/* MAP */}
          <div className="h-[360px] w-full rounded-xl overflow-hidden shadow relative z-0">
            <MapContainer center={guardPos || [5.65, 100.5]} zoom={16} style={{ height: "100%", width: "100%" }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
              {guardPos && (
                <Marker position={guardPos}>
                  <Popup>{(guardName === "-" ? "Guard" : guardName)} ({plateNo === "-" ? "" : plateNo})</Popup>
                </Marker>
              )}

              {assignments.map((a) => (
                <Marker
                  key={a.id}
                  position={[a.lat || 5.65 + Math.random() * 0.001, a.lng || 100.5 + Math.random() * 0.001]}
                >
                  <Popup>{a.house_no} {a.street_name} ({a.block})</Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {/* TASK LIST */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {assignments.map((a) => (
              <div key={a.id} className={`p-4 rounded-xl shadow border ${a.status === "completed" ? "border-green-400 bg-green-50" : "border-yellow-300 bg-white"}`}>
                <p className="font-semibold mb-1">🏠 {a.house_no} {a.street_name} ({a.block})</p>
                <p className="text-sm mb-2">Session: {a.session_no}</p>
                <button onClick={() => openCamera("house", a)} className="w-full bg-accent text-white py-2 rounded-lg flex justify-center items-center gap-1">
                  <Camera className="w-4 h-4" /> Snap
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* CAMERA MODAL */}
      {mode && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999]">
          <div className="bg-white p-4 rounded-xl shadow-lg w-[420px]">
            <video ref={videoRef} width="400" height="300" className="rounded-md" autoPlay playsInline />
            <canvas ref={canvasRef} width="400" height="300" hidden />

            {photoPreview ? (
              <img src={photoPreview} alt="preview" className="rounded-md my-3 w-full" />
            ) : (
              <button onClick={capturePhoto} className="w-full bg-accent text-white py-2 rounded-lg mt-3">Capture</button>
            )}

            {photoPreview && (
              <button onClick={handleUpload} className="w-full bg-green-600 text-white py-2 rounded-lg mt-2 flex justify-center gap-2">
                {loading ? (<><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>) : "Upload & Send"}
              </button>
            )}

            <button onClick={() => { stopCamera(); setMode(null); setPhotoPreview(null); setTargetHouse(null); }} className="w-full bg-gray-300 text-black py-2 rounded-lg mt-2">Close</button>
          </div>
        </div>
      )}

      {/* 🧭 Bottom Navigation */}
      <GuardBottomNav />
    </div>
  );
}