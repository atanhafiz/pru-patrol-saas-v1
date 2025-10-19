// AHE SmartPatrol Hybrid Stable – RouteList_v11.jsx (Web Stable - native capture camera)
import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { sendTelegramPhoto } from "../shared_v11/api/telegram";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Camera, Loader2 } from "lucide-react";
import GuardBottomNav from "../components/GuardBottomNav";
import toast from "react-hot-toast";

export default function RouteList_v11() {
  const [assignments, setAssignments] = useState([]);
  const [guardName, setGuardName] = useState("");
  const [plateNo, setPlateNo] = useState("");
  const [registered, setRegistered] = useState(false);
  const [guardPos, setGuardPos] = useState(null);
  const [mode, setMode] = useState(null); // selfieIn | selfieOut | snapHouse
  const [targetHouse, setTargetHouse] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // fetch assignments
  useEffect(() => {
    const fetchAssignments = async () => {
      const { data, error } = await supabase
        .from("patrol_assignments")
        .select("*")
        .order("session_no", { ascending: true });
      if (!error) setAssignments(data || []);
    };
    fetchAssignments();

    const watch = navigator.geolocation.watchPosition(
      (pos) => setGuardPos([pos.coords.latitude, pos.coords.longitude]),
      (err) => console.error("GPS error:", err),
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watch);
  }, []);

  // dataURL helper
  const dataURLtoBlob = (dataurl) => {
    const arr = dataurl.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    const u8arr = new Uint8Array(bstr.length);
    for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
    return new Blob([u8arr], { type: mime });
  };

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

  const handleUploadFile = async (file, label = "Unknown House") => {
    try {
      setLoading(true);
      const ts = Date.now();
      const coords = guardPos ? `${guardPos[0]},${guardPos[1]}` : "No GPS";
      const blob = file;
      const filePath = `houses/${guardName}_${plateNo}_${ts}.jpg`;

      const photoUrl = await uploadToSupabase(filePath, blob);
      const caption = `🏠 ${label}\n👤 ${guardName}\n🏍️ ${plateNo}\n📍 ${coords}\n🕓 ${new Date().toLocaleString()}`;
      await sendTelegramPhoto(photoUrl, caption);

      toast.success("✅ Sent to Telegram!");
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("❌ Upload failed: " + (err.message || err));
    } finally {
      setLoading(false);
      setMode(null);
      setTargetHouse(null);
    }
  };

  const handleSelfie = async (type) => {
    try {
      const facing = type === "selfieIn" || type === "selfieOut" ? "user" : "environment";
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: facing } },
        audio: false,
      });
      const video = document.createElement("video");
      video.srcObject = stream;
      await video.play();
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 300;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, 400, 300);
      const dataUrl = canvas.toDataURL("image/jpeg");
      const blob = dataURLtoBlob(dataUrl);

      const ts = Date.now();
      const coords = guardPos ? `${guardPos[0]},${guardPos[1]}` : "No GPS";
      const folder = type === "selfieIn" ? "selfies/in" : "selfies/out";
      const filePath = `${folder}/${guardName}_${plateNo}_${ts}.jpg`;
      const photoUrl = await uploadToSupabase(filePath, blob);
      const caption =
        type === "selfieIn"
          ? `🚨 Guard On Duty\n👤 ${guardName}\n🏍️ ${plateNo}\n📍 ${coords}`
          : `✅ Patrol Ended\n👤 ${guardName}\n🏍️ ${plateNo}\n📍 ${coords}`;
      await sendTelegramPhoto(photoUrl, caption);
      toast.success("✅ Selfie sent!");
      stream.getTracks().forEach((t) => t.stop());
    } catch (err) {
      console.error("Selfie error:", err);
      toast.error("Camera not accessible. Please allow permission.");
    }
  };

  // ========= UI =========
  return (
    <div className="p-5 space-y-5 pb-16">
      <h1 className="text-2xl font-bold text-primary">
        AHE SmartPatrol (Web Stable)
      </h1>

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
              setRegistered(true);
              toast.success("✅ Registered");
            }}
            className="bg-accent text-white px-4 py-2 rounded w-full"
          >
            Save
          </button>
        </div>
      ) : (
        <>
          {/* Selfie Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => handleSelfie("selfieIn")}
              className="bg-green-500 text-white px-4 py-2 rounded flex items-center gap-2"
            >
              <Camera className="w-4 h-4" /> Selfie IN
            </button>
            <button
              onClick={() => handleSelfie("selfieOut")}
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
                  <Popup>
                    {guardName} ({plateNo})
                  </Popup>
                </Marker>
              )}
              {assignments.map((a) => (
                <Marker
                  key={a.id}
                  position={[
                    a.lat || 5.65 + Math.random() * 0.001,
                    a.lng || 100.5 + Math.random() * 0.001,
                  ]}
                >
                  <Popup>
                    {a.house_no} {a.street_name} ({a.block})
                    <br />
                    <label className="bg-blue-500 text-white rounded px-2 py-1 mt-2 cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        hidden
                        ref={fileInputRef}
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) handleUploadFile(file, a.house_no);
                        }}
                      />
                      Snap
                    </label>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </>
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
