// PRU Patrol Sandbox v1.1 – IncidentForm_v11.jsx (rear camera OK)
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { supabase } from "../../lib/supabaseClient";
import { sendTelegramPhoto } from "../../shared/api/telegram";
import { Upload, Image, Send, Camera } from "lucide-react";
import { logEvent } from "../../lib/logEvent";

export default function IncidentForm_v11() {
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [guardName, setGuardName] = useState(localStorage.getItem("guardName") || "");
  const [plateNo, setPlateNo] = useState(localStorage.getItem("plateNo") || "");
  const [mode, setMode] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const openCamera = async () => {
    setMode("camera");
    try {
      const constraints = {
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error("Camera access error:", err);
      alert("Camera not accessible. Please allow permission and reload.");
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);
    const dataURL = canvas.toDataURL("image/jpeg");
    setPhotoPreview(dataURL);
    setPreview(dataURL);
    const stream = videoRef.current.srcObject;
    if (stream) stream.getTracks().forEach((t) => t.stop());
    setMode(null);
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    if (stream) stream.getTracks().forEach((t) => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const resetForm = () => {
    setDescription("");
    setPhoto(null);
    setPreview("");
    setPhotoPreview("");
    setStatus("");
  };

  const uploadPhoto = async (imageData) => {
    let blob;
    if (typeof imageData === "string" && imageData.startsWith("data:")) {
      const res = await fetch(imageData);
      blob = await res.blob();
    } else blob = imageData;

    const filePath = `incident/${guardName || ""}_${Date.now()}.jpg`;
    const { data, error } = await supabase.storage
      .from("incident-photos")
      .upload(filePath, blob, { upsert: true, contentType: "image/jpeg" });
    if (error) throw error;
    const { data: publicUrlData } = supabase.storage
      .from("incident-photos")
      .getPublicUrl(data.path);
    return publicUrlData.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus("Getting location...");
    try {
      const position = await new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, {
          enableHighAccuracy: true,
          timeout: 10000,
        })
      );
      const lat = position?.coords?.latitude?.toFixed(6) ?? null;
      const lon = position?.coords?.longitude?.toFixed(6) ?? null;
      let photoUrl = null;
      if (photoPreview) {
        setStatus("Uploading camera photo...");
        photoUrl = await uploadPhoto(photoPreview);
      } else if (photo) {
        setStatus("Uploading file photo...");
        photoUrl = await uploadPhoto(photo);
      }
      setStatus("Saving incident...");
      const { error: insertError } = await supabase.from("incidents").insert([
        {
          guard_name: guardName,
          plate_no: plateNo,
          description,
          photo_url: photoUrl,
          lat,
          lon,
          created_at: new Date().toISOString(),
        },
      ]);
      if (insertError) throw insertError;

      const osmLink = lat && lon ? `OSM: [OpenStreetMap](https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=19/${lat}/${lon})` : "";
      const googleLink = lat && lon ? `Google: [Google Maps](https://maps.google.com/?q=${lat},${lon})` : "";
      const caption = `🚨 New Incident Report
👤 ${guardName}
🏍️ ${plateNo}
📝 ${description}
${osmLink}
${googleLink}
🕓 ${new Date().toLocaleString()}`;
      // Send Telegram async (fire-and-forget)
      sendTelegramPhoto(photoUrl || "", caption)
        .then(() => {
          console.log("✅ Telegram sent (async)");
          // Play success sound and vibration
          try {
            const audio = new Audio("/success.mp3");
            audio.play().catch(() => {}); // Ignore audio errors
            if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
          } catch (e) {
            console.log("Audio/vibration not available");
          }
        })
        .catch((err) => {
          console.error("❌ Telegram error:", err);
        });
      
      await logEvent("INCIDENT", description, guardName);
      
      // Direct activity_log insert for better data consistency
      await supabase.from("activity_log").insert([
        {
          event_type: "INCIDENT",
          description: description || "No description provided",
          guard_name: guardName || "Guard",
          created_at: new Date().toISOString(),
        },
      ]);
      
      resetForm();
      setStatus("✅ Incident submitted successfully!");
      setTimeout(() => setStatus(""), 3000);
    } catch (err) {
      console.error("Incident submit failed:", err);
      setStatus(`❌ Upload failed: ${err.message}`);
      setTimeout(() => setStatus(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.div
        className="min-h-screen bg-gradient-to-br from-[#f7faff] via-white to-[#edf3ff] p-4 sm:p-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="bg-white/90 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 p-4 sm:p-6">
          <h2 className="text-2xl font-semibold text-[#0B132B] mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-accent" /> Incident Report
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4" disabled={loading}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Guard Name
                </label>
                <input
                  type="text"
                  value={guardName}
                  onChange={(e) => setGuardName(e.target.value)}
                  disabled={loading}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  placeholder="Guard name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plate Number
                </label>
                <input
                  type="text"
                  value={plateNo}
                  onChange={(e) => setPlateNo(e.target.value)}
                  disabled={loading}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  placeholder="Plate number"
                />
              </div>
            </div>

            <textarea
              placeholder="Describe the incident..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              disabled={loading}
              className="w-full p-3 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />

            <div className="flex gap-3">
              <label className="cursor-pointer flex items-center gap-2 text-accent font-medium">
                <Image className="w-5 h-5" />
                Attach Photo
                <input type="file" accept="image/*" hidden onChange={handleFileChange} />
              </label>
              <button
                type="button"
                onClick={openCamera}
                className="flex items-center gap-2 px-3 py-2 text-accent font-medium"
              >
                <Camera className="w-5 h-5" /> Camera
              </button>
            </div>

            {preview && (
              <motion.img
                src={preview}
                alt="Preview"
                className="rounded-2xl shadow-md max-h-56 object-cover"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              />
            )}

            <button
              type="submit"
              disabled={loading}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl shadow-md hover:shadow-lg transition ${
                loading ? "bg-gray-400" : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
              }`}
            >
              <Send className="w-4 h-4" />
              {loading ? "Submitting..." : "Submit Report"}
            </button>

            {status && (
              <div className="mt-2 p-3 rounded-lg text-sm bg-blue-100 text-blue-800">
                {status}
              </div>
            )}
          </form>
        </div>
      </motion.div>

      {mode === "camera" && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999]">
          <div className="bg-white p-4 rounded-2xl shadow-lg w-[420px]">
            <video ref={videoRef} width="400" height="300" autoPlay playsInline />
            <canvas ref={canvasRef} width="400" height="300" hidden />
            {photoPreview ? (
              <img src={photoPreview} alt="preview" className="rounded-2xl my-3 w-full" />
            ) : (
              <button
                onClick={capturePhoto}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-2 rounded-xl mt-3 shadow-md hover:shadow-lg transition"
              >
                Capture
              </button>
            )}
            <button
              onClick={() => {
                stopCamera();
                setMode(null);
                setPhotoPreview(null);
              }}
              className="w-full bg-gray-300 text-black py-2 rounded-xl mt-2"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
