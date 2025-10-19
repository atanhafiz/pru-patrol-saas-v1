// AHE SmartPatrol v1.2 – RouteList_v11.jsx
import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { sendTelegramAlert, sendTelegramPhoto } from "../shared_v11/api/telegram";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Camera, Loader2, CheckCircle, Clock } from "lucide-react";
import GuardBottomNav from "../components/GuardBottomNav";
import toast from "react-hot-toast";

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
  const [guardName, setGuardName] = useState("");
  const [plateNo, setPlateNo] = useState("");
  const [registered, setRegistered] = useState(false);

  // Patrol session state
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [completedHouses, setCompletedHouses] = useState([]);
  const [currentHouseIndex, setCurrentHouseIndex] = useState(0);

  const [guardPos, setGuardPos] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [mode, setMode] = useState(null); // "selfieIn" | "selfieOut" | "snapHouse"
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
        const { latitude, longitude, accuracy } = pos.coords;
        const currentTime = Date.now();
        
        setGuardPos([latitude, longitude]);
        setGpsAccuracy(accuracy ? Math.round(accuracy) : 5);
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
    toast.success("✅ Registered successfully!");
  };

  // ---------- PATROL SESSION MANAGEMENT ----------
  const startPatrolSession = async () => {
    try {
      const startTime = new Date();
      setSessionStartTime(startTime);
      setSessionActive(true);
      setCompletedHouses([]);
      setCurrentHouseIndex(0);
      
      // Send Selfie In notification
      await sendTelegramAlert("GUARD_ON_DUTY", {
        message: `🚨 Guard On Duty\n👤 ${guardName}\n🏍️ ${plateNo}\n🕓 ${startTime.toLocaleString()}`
      });
      
      toast.success("🚨 Patrol session started!");
    } catch (err) {
      console.error("Start session error:", err);
      toast.error("Failed to start patrol session");
    }
  };

  const completePatrolSession = async () => {
    try {
      const endTime = new Date();
      const duration = Math.round((endTime - sessionStartTime) / 1000 / 60); // minutes
      
      // Send Selfie Out notification
      await sendTelegramAlert("PATROL_COMPLETED", {
        message: `✅ Patrol Session Completed\n👤 ${guardName}\n🏍️ ${plateNo}\n🕓 ${endTime.toLocaleString()}\n⏱️ Duration: ${duration} minutes`
      });
      
      // Reset session state
      setSessionActive(false);
      setSessionStartTime(null);
      setCompletedHouses([]);
      setCurrentHouseIndex(0);
      
      toast.success("✅ Patrol session completed!");
    } catch (err) {
      console.error("Complete session error:", err);
      toast.error("Failed to complete patrol session");
    }
  };
  
  const handleResetRegistration = () => {
    localStorage.removeItem("guardName");
    localStorage.removeItem("plateNo");
    setGuardName("");
    setPlateNo("");
    setRegistered(false);
  };

  // ---------- CAMERA ----------
  // ---------- CAMERA CONTROL ----------
  const openCamera = async (type, house = null) => {
    setMode(type);
    setTargetHouse(house);
    
    try {
      // Determine camera facing mode based on type
      const facingMode = (type === "selfieIn" || type === "selfieOut") ? "user" : "environment";
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error("openCamera error:", err);
      toast.error("Camera not accessible. Please check permissions.");
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
  // ---------- HOUSE SNAPPING ----------
  const snapHouse = async (house) => {
    try {
      setLoading(true);
      const timestamp = Date.now();
      const coords = guardPos ? `${guardPos[0]},${guardPos[1]}` : "No GPS";
      
      // Upload photo to Supabase storage
      const filePath = `patrol/${guardName}_${timestamp}.jpg`;
      const photoUrl = await uploadToSupabase(filePath, photoPreview);
      
      // Save patrol record to database
      const { error: insertError } = await supabase.from("patrol_records").insert({
        guard_name: guardName,
        plate_no: plateNo,
        house_no: house.house_no,
        street_name: house.street_name,
        block: house.block,
        lat: guardPos?.[0] || null,
        lon: guardPos?.[1] || null,
        photo_url: photoUrl,
        timestamp: new Date().toISOString()
      });
      
      if (insertError) throw insertError;
      
      // Send Telegram notification with enhanced GPS details
      const lat = guardPos?.[0] || 0;
      const lon = guardPos?.[1] || 0;
      const accuracy = gpsAccuracy || 5;
      
      const telegramMessage = `📸 Guard snapped ${house.house_no}, ${house.block}
👤 ${guardName}
🏍️ ${plateNo}
GPS: ${lat}, ${lon} (±${accuracy}m)
OSM: https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=19/${lat}/${lon}
Google: https://maps.google.com/?q=${lat},${lon}
🕓 ${new Date().toLocaleString()}`;
      
      await sendTelegramPhoto(photoUrl, telegramMessage);
      
      // Update completed houses
      setCompletedHouses(prev => [...prev, house.id]);
      setCurrentHouseIndex(prev => prev + 1);
      
      toast.success(`📸 House ${house.house_no} snapped successfully!`);
      
    } catch (err) {
      console.error("Snap house error:", err);
      toast.error("Failed to snap house: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!photoPreview || !mode) return;
    setLoading(true);
    try {
      const ts = Date.now();
      const coords = guardPos ? `${guardPos[0]},${guardPos[1]}` : "No GPS";
      let photoUrl = "";
      let caption = "";

      if (mode === "selfieIn") {
        const folder = "selfies/in";
        const filePath = `${folder}/${(guardName || "-")}_${(plateNo || "-")}_${ts}.jpg`;
        photoUrl = await uploadToSupabase(filePath, photoPreview);
        caption = `🚨 Guard On Duty\n👤 ${guardName}\n🏍️ ${plateNo}\n📍 ${coords}\n🕓 ${new Date().toLocaleString()}`;
        
        await logActivity("checkin", `Started patrol at Prima Residensi Utama`);
        await startPatrolSession();
        
      } else if (mode === "selfieOut") {
        // Selfie Out with front camera capture
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user" },
            audio: false
          });
          const videoTrack = stream.getVideoTracks()[0];
          const imageCapture = new ImageCapture(videoTrack);
          const blob = await imageCapture.takePhoto();

          const photoUrl = URL.createObjectURL(blob);

          // Send photo to Telegram
          await sendTelegramPhoto(photoUrl, `✅ Patrol Session Ended\n👤 ${guardName}\n🏍️ ${plateNo}\n🕓 ${new Date().toLocaleString()}`);

          // Then send text message
          await sendTelegramAlert("SESSION", {
            message: `✅ Patrol Session Ended\n👤 ${guardName}\n🏍️ ${plateNo}\n🕓 ${new Date().toLocaleString()}`
          });

          videoTrack.stop();
          toast.success("Patrol session selfie captured and admin notified.");
          
        } catch (err) {
          console.error("Selfie Out camera error:", err);
          toast.error("Camera capture failed, sending text alert only.");
          
          // Fallback to text-only alert
          await sendTelegramAlert("SESSION", {
            message: `✅ Patrol Session Ended\n👤 ${guardName}\n🏍️ ${plateNo}\n🕓 ${new Date().toLocaleString()}`
          });
        }
        
        // Skip photo upload and other processing
        setPhotoPreview(null);
        setMode(null);
        setTargetHouse(null);
        return;
        
      } else if (mode === "snapHouse" && targetHouse) {
        await snapHouse(targetHouse);
        setPhotoPreview(null);
        setMode(null);
        setTargetHouse(null);
        return;
      }

      await sendTelegramPhoto(photoUrl, caption);

      toast.success("✅ Uploaded & sent to Telegram!");
      setPhotoPreview(null);
      setMode(null);
      setTargetHouse(null);
      fetchAssignments();
      
      // Refresh UI after successful operation
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error("handleUpload:", err);
      toast.error("❌ Upload failed: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  // ---------- UI ----------
  return (
    <div className="p-5 space-y-5 pb-16">
      <h1 className="text-2xl font-bold text-primary">AHE SmartPatrol v1.2</h1>

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
          {/* PATROL SESSION STATUS */}
          {sessionActive && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-blue-800">Patrol Session Active</span>
              </div>
              <p className="text-sm text-blue-600">
                House {currentHouseIndex + 1} of {assignments.length} completed
              </p>
              <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentHouseIndex) / assignments.length) * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* SELFIE BUTTONS */}
          <div className="flex gap-2">
            <button 
              onClick={() => openCamera("selfieIn")} 
              disabled={sessionActive}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              Selfie IN
            </button>
            <button 
              onClick={() => openCamera("selfieOut")} 
              disabled={!sessionActive}
              className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-4 py-2 rounded flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
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

          {/* HOUSE ASSIGNMENTS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {assignments.map((a, index) => {
              const isCompleted = completedHouses.includes(a.id);
              const isCurrent = sessionActive && index === currentHouseIndex;
              
              return (
                <div 
                  key={a.id} 
                  className={`p-4 rounded-xl shadow border transition-all ${
                    isCompleted 
                      ? "border-green-400 bg-green-50" 
                      : isCurrent 
                        ? "border-blue-400 bg-blue-50 ring-2 ring-blue-300" 
                        : "border-yellow-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold">🏠 {a.house_no} {a.street_name} ({a.block})</p>
                    {isCompleted && <CheckCircle className="w-5 h-5 text-green-600" />}
                    {isCurrent && <Clock className="w-5 h-5 text-blue-600" />}
                  </div>
                  <p className="text-sm mb-2">Session: {a.session_no}</p>
                  
                  {sessionActive && isCurrent && (
                    <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mb-2">
                      📍 Current House
                    </div>
                  )}
                  
                  <button 
                    onClick={() => openCamera("snapHouse", a)} 
                    disabled={!sessionActive || isCompleted}
                    className="w-full bg-accent hover:bg-accent/80 disabled:bg-gray-400 text-white py-2 rounded-lg flex justify-center items-center gap-1"
                  >
                    <Camera className="w-4 h-4" /> 
                    {isCompleted ? "Completed" : "Snap Photo"}
                  </button>
                </div>
              );
            })}
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