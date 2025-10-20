// AHE SmartPatrol Hybrid Stable – RouteList.jsx (Fix: Register form muncul + stay on page selepas Snap)
import { useEffect, useState, useRef } from "react";
import { supabase } from "../../lib/supabaseClient";
import { sendTelegramPhoto } from "../../shared_v11/api/telegram";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Camera, Loader2 } from "lucide-react";
import GuardBottomNav from "../../components/GuardBottomNav";
import toast from "react-hot-toast";

export default function RouteList() {
  const [assignments, setAssignments] = useState([]);
  const [guardName, setGuardName] = useState("");
  const [plateNo, setPlateNo] = useState("");
  const [registered, setRegistered] = useState(false);
  const [guardPos, setGuardPos] = useState(null);
  const [loading, setLoading] = useState(false);

  const [showCamera, setShowCamera] = useState(false);
  const [selfieType, setSelfieType] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // ✅ Auto load guard info (dan buka form bila kosong)
  useEffect(() => {
    const savedName = localStorage.getItem("guardName");
    const savedPlate = localStorage.getItem("plateNo");

    if (!savedName || !savedPlate) {
      // Tiada data — buka form register
      setRegistered(false);
      setGuardName("");
      setPlateNo("");
    } else {
      setGuardName(savedName);
      setPlateNo(savedPlate);
      setRegistered(true);
    }
  }, []);

  // ✅ Fetch semua assignment
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

  useEffect(() => {
    fetchAssignments();
    const watch = navigator.geolocation.watchPosition(
      (pos) => setGuardPos([pos.coords.latitude, pos.coords.longitude]),
      (err) => console.error("GPS error:", err),
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watch);
  }, []);

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
      const facing = type === "selfieIn" || type === "selfieOut" ? "user" : "environment";
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
      const { error: upErr } = await supabase.storage
        .from("patrol-photos")
        .upload(filePath, blob, { upsert: true });
      if (upErr) throw upErr;
      const { data } = await supabase.storage
        .from("patrol-photos")
        .getPublicUrl(filePath);
      const photoUrl = data.publicUrl;

      const coords = guardPos ? `${guardPos[0]},${guardPos[1]}` : "No GPS";
      const caption =
        selfieType === "selfieIn"
          ? `🚨 *Guard On Duty*\n👤 ${guardName}\n🏍️ ${plateNo}\n📍 ${coords}\n🕓 ${new Date().toLocaleString()}`
          : `✅ *Patrol Ended*\n👤 ${guardName}\n🏍️ ${plateNo}\n📍 ${coords}\n🕓 ${new Date().toLocaleString()}`;
      await sendTelegramPhoto(photoUrl, caption);
      toast.success("✅ Selfie sent!");
    } catch (err) {
      console.error("Selfie error:", err);
      toast.error("Failed to send selfie.");
    } finally {
      setLoading(false);
    }
  };

  // 📦 Snap Rumah
  const handleUploadFile = async (file, assignment) => {
    try {
      setLoading(true);
      const ts = Date.now();
      const coords = guardPos ? `${guardPos[0]},${guardPos[1]}` : "No GPS";
      const blob = file;
      const { house_no, street_name, block } = assignment || {};
      const filePath = `houses/${house_no}_${plateNo}_${ts}.jpg`;

      const photoUrl = await uploadToSupabase(filePath, blob);
      const caption = `🏠 *${house_no} ${street_name} (${block})*\n👤 ${guardName}\n🏍️ ${plateNo}\n📍 ${coords}\n🕓 ${new Date().toLocaleString()}`;
      await sendTelegramPhoto(photoUrl, caption);

      toast.success("✅ Sent to Telegram!");
      // ❌ Jangan reload page — kekal kat sini
      await fetchAssignments();
      setLoading(false);
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("❌ Upload failed: " + (err.message || err));
      setLoading(false);
    }
  };

  // Group ikut session
  const groupedAssignments = assignments.reduce((acc, a) => {
    const session = a.session_no || 0;
    if (!acc[session]) acc[session] = [];
    acc[session].push(a);
    return acc;
  }, {});

  return (
    <div className="p-5 space-y-5 pb-16">
      <h1 className="text-2xl font-bold text-primary">Routes</h1>

      {!registered ? (
        <div className="bg-white p-4 rounded-xl shadow max-w-md">
          <h3 className="font-semibold mb-2">Register Guard</h3>
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
              localStorage.setItem("guardName", guardName);
              localStorage.setItem("plateNo", plateNo);
              setRegistered(true);
              toast.success("✅ Registered");
              fetchAssignments();
            }}
            className="bg-accent text-white px-4 py-2 rounded w-full"
          >
            Save
          </button>
        </div>
      ) : (
        <>
          {/* Selfie Buttons */}
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => openSelfie("selfieIn")}
              className="bg-green-500 text-white px-4 py-2 rounded flex items-center gap-2"
            >
              <Camera className="w-4 h-4" /> Selfie IN
            </button>
            <button
              onClick={() => openSelfie("selfieOut")}
              className="bg-red-500 text-white px-4 py-2 rounded flex items-center gap-2"
            >
              <Camera className="w-4 h-4" /> Selfie OUT
            </button>
          </div>

          {/* Map */}
          <div className="h-[360px] w-full rounded-xl overflow-hidden shadow relative z-0">
            <MapContainer
              center={guardPos || [5.65, 100.5]}
              zoom={16}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap"
              />
              {guardPos && (
                <Marker position={guardPos}>
                  <Popup>{guardName} ({plateNo})</Popup>
                </Marker>
              )}
              {assignments.map((a) => (
                <Marker key={a.id} position={[a.lat || 0, a.lng || 0]}>
                  <Popup>
                    {a.house_no} {a.street_name} ({a.block}) — Session {a.session_no}
                    <br />
                    <label className="bg-blue-500 text-white rounded px-2 py-1 mt-2 cursor-pointer text-xs">
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        hidden
                        ref={fileInputRef}
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) handleUploadFile(file, a);
                        }}
                      />
                      📸 Snap
                    </label>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {/* Grouped by Session */}
          <div className="bg-white mt-3 p-3 rounded-lg shadow text-sm">
            <h3 className="font-semibold mb-2">🏠 Assigned Houses</h3>
            {Object.keys(groupedAssignments).map((session) => (
              <div key={session} className="mb-3">
                <h4 className="font-semibold text-accent mb-1">Session {session}</h4>
                <ul className="space-y-1">
                  {groupedAssignments[session].map((a) => (
                    <li
                      key={a.id}
                      className="flex justify-between items-center bg-gray-50 p-2 rounded"
                    >
                      <span>
                        {a.house_no} {a.street_name} ({a.block})
                      </span>
                      <label className="bg-blue-500 text-white rounded px-2 py-1 text-xs cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          hidden
                          ref={fileInputRef}
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) handleUploadFile(file, a);
                          }}
                        />
                        Snap
                      </label>
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
            <video ref={videoRef} width="400" height="300" autoPlay playsInline className="rounded-md" />
            <canvas ref={canvasRef} width="400" height="300" hidden />
            <button onClick={captureSelfie} className="w-full bg-accent text-white py-2 rounded-lg mt-3">
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
