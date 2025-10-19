// AHE SmartPatrol Hybrid Stable – RouteList_v11.jsx (final with switch camera)
import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { sendTelegramPhoto } from "../shared_v11/api/telegram";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Camera, Loader2, RefreshCw } from "lucide-react";
import GuardBottomNav from "../components/GuardBottomNav";
import toast from "react-hot-toast";

export default function RouteList_v11() {
  const [assignments, setAssignments] = useState([]);
  const [guardName, setGuardName] = useState("");
  const [plateNo, setPlateNo] = useState("");
  const [registered, setRegistered] = useState(false);
  const [guardPos, setGuardPos] = useState(null);
  const [mode, setMode] = useState(null);
  const [targetHouse, setTargetHouse] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cameraFacing, setCameraFacing] = useState("user"); // switch
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

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

  // CAMERA CONTROL
  const openCamera = async (type, house = null) => {
    setMode(type);
    setTargetHouse(house);
    try {
      const facingMode =
        type === "selfieIn" || type === "selfieOut"
          ? "user"
          : { exact: "environment" };
      setCameraFacing(facingMode === "user" ? "user" : "environment");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error("openCamera error:", err);
      toast.error("Camera not accessible. Please check permissions.");
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    stream?.getTracks()?.forEach((t) => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const switchCamera = async () => {
    try {
      const newFacing = cameraFacing === "user" ? "environment" : "user";
      setCameraFacing(newFacing);
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: newFacing } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error("switchCamera error:", err);
      toast.error("Cannot switch camera. Device may not support this mode.");
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, 400, 300);
    const dataUrl = canvasRef.current.toDataURL("image/jpeg");
    setPhotoPreview(dataUrl);
    stopCamera();
  };

  const dataURLtoBlob = (dataurl) => {
    const arr = dataurl.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    const u8arr = new Uint8Array(bstr.length);
    for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
    return new Blob([u8arr], { type: mime });
  };

  const uploadToSupabase = async (filePath, dataUrl) => {
    const blob = dataURLtoBlob(dataUrl);
    const { error: upErr } = await supabase.storage
      .from("patrol-photos")
      .upload(filePath, blob, { contentType: "image/jpeg", upsert: true });
    if (upErr) throw upErr;
    const { data } = await supabase.storage
      .from("patrol-photos")
      .getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleUpload = async () => {
    if (!photoPreview || !mode) return;
    setLoading(true);
    try {
      const ts = Date.now();
      const coords = guardPos ? `${guardPos[0]},${guardPos[1]}` : "No GPS";
      const folder =
        mode === "selfieIn"
          ? "selfies/in"
          : mode === "selfieOut"
          ? "selfies/out"
          : "houses";
      const filePath = `${folder}/${guardName}_${plateNo}_${ts}.jpg`;
      const photoUrl = await uploadToSupabase(filePath, photoPreview);
      const caption =
        mode === "selfieIn"
          ? `🚨 Guard On Duty\n👤 ${guardName}\n🏍️ ${plateNo}\n📍 ${coords}`
          : mode === "selfieOut"
          ? `✅ Patrol Session Ended\n👤 ${guardName}\n🏍️ ${plateNo}\n📍 ${coords}`
          : `🏠 House Photo\n👤 ${guardName}\n🏍️ ${plateNo}\n📍 ${coords}`;
      await sendTelegramPhoto(photoUrl, caption);
      toast.success("✅ Sent to Telegram!");
    } catch (err) {
      console.error("handleUpload:", err);
      toast.error("❌ Failed: " + (err.message || err));
    } finally {
      setPhotoPreview(null);
      setMode(null);
      setTargetHouse(null);
      setLoading(false);
    }
  };

  return (
    <div className="p-5 space-y-5 pb-16">
      <h1 className="text-2xl font-bold text-primary">
        AHE SmartPatrol (Hybrid Stable)
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
          <div className="flex gap-2">
            <button
              onClick={() => openCamera("selfieIn")}
              className="bg-green-500 text-white px-4 py-2 rounded flex items-center gap-2"
            >
              <Camera className="w-4 h-4" /> Selfie IN
            </button>
            <button
              onClick={() => openCamera("selfieOut")}
              className="bg-red-500 text-white px-4 py-2 rounded flex items-center gap-2"
            >
              <Camera className="w-4 h-4" /> Selfie OUT
            </button>
          </div>

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
                    <button
                      onClick={() => openCamera("snapHouse", a)}
                      className="bg-blue-500 text-white rounded px-2 py-1 mt-2"
                    >
                      Snap
                    </button>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </>
      )}

      {mode && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999]">
          <div className="bg-white p-4 rounded-xl shadow-lg w-[420px]">
            <video
              ref={videoRef}
              width="400"
              height="300"
              className="rounded-md"
              autoPlay
              playsInline
            />
            <canvas ref={canvasRef} width="400" height="300" hidden />

            {/* SWITCH CAMERA BUTTON */}
            {!photoPreview && (
              <button
                onClick={switchCamera}
                className="absolute top-2 right-2 bg-gray-200 text-black px-2 py-1 rounded-md flex items-center gap-1 text-xs"
              >
                <RefreshCw size={12} /> Switch
              </button>
            )}

            {photoPreview ? (
              <img
                src={photoPreview}
                alt="preview"
                className="rounded-md my-3 w-full"
              />
            ) : (
              <button
                onClick={capturePhoto}
                className="w-full bg-accent text-white py-2 rounded-lg mt-3"
              >
                Capture
              </button>
            )}
            {photoPreview && (
              <button
                onClick={handleUpload}
                className="w-full bg-green-600 text-white py-2 rounded-lg mt-2 flex justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
                  </>
                ) : (
                  "Upload & Send"
                )}
              </button>
            )}
            <button
              onClick={() => {
                stopCamera();
                setMode(null);
                setPhotoPreview(null);
                setTargetHouse(null);
              }}
              className="w-full bg-gray-300 text-black py-2 rounded-lg mt-2"
            >
              Close
            </button>
          </div>
        </div>
      )}
      <GuardBottomNav />
    </div>
  );
}
