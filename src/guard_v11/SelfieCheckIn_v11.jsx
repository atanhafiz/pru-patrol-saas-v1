import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Camera, MapPin, CheckCircle } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { logEvent } from "../lib/logEvent";
import { sendTelegramAlert } from "../shared_v11/api/telegram";
import LoadingSpinner from "../shared_v11/components/LoadingSpinner";
import ErrorBoundary from "../shared_v11/components/ErrorBoundary";

export default function SelfieCheckIn_v11() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [captured, setCaptured] = useState("");
  const [coords, setCoords] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [guardName, setGuardName] = useState("");

  useEffect(() => {
    startCamera();
    getLocation();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      videoRef.current.srcObject = stream;
    } catch (err) {
      console.error("Upload error:", err.message);
      setStatus(`❌ Failed: ${err.message}`);
    }
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      setStatus("⚠️ GPS not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => setStatus("⚠️ Failed to get GPS location")
    );
  };

  const capturePhoto = () => {
    const context = canvasRef.current.getContext("2d");
    context.drawImage(videoRef.current, 0, 0, 300, 300);
    const imgData = canvasRef.current.toDataURL("image/png");
    setCaptured(imgData);
    videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
  };

  const handleSubmit = async () => {
    if (!captured || !coords || !guardName.trim()) {
      setStatus("⚠️ Please enter your name, take selfie & enable GPS first");
      return;
    }
    setLoading(true);
    try {

      const fileName = `attendance/${guardName}_${Date.now()}.png`;
      const base64Data = captured.split(",")[1];
      const blob = await fetch(captured).then((r) => r.blob());

      const { data, error } = await supabase.storage
        .from("attendance-photos")
        .upload(fileName, blob, { contentType: "image/png" });
      if (error) throw error;

      const { data: publicUrl } = supabase.storage
        .from("attendance-photos")
        .getPublicUrl(data.path);

      const { error: insertError } = await supabase.from("attendance_log").insert([
        {
          selfie_url: publicUrl.publicUrl,
          lat: coords.lat,
          long: coords.lng,
          guard_name: guardName.trim(),
        },
      ]);
      if (insertError) throw insertError;

      setStatus("✅ Attendance submitted successfully");
      await logEvent("CHECKIN", "Guard submitted selfie check-in", "Guard");
      
      // Send Telegram alert using centralized function
      try {
        await sendTelegramAlert("ATTENDANCE_CHECKIN", {
          message: `✅ Guard Attendance Check-In\n👤 ${guardName.trim()}\n📍 ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}\n🕓 ${new Date().toLocaleString()}`
        });
        console.log("✅ Telegram alert sent for attendance check-in");
      } catch (telegramErr) {
        console.error("❌ Failed to send Telegram alert:", telegramErr);
        // Don't fail the whole process if Telegram fails
      }
      
      setCaptured("");
      setGuardName("");
      
      // Auto-refresh after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      console.error(err);
      setStatus("❌ Failed to submit attendance");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <motion.div
        className="bg-white rounded-2xl shadow-md p-6 mt-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-2xl font-semibold text-primary mb-4 flex items-center gap-2">
          <Camera className="w-5 h-5 text-accent" /> Selfie Check-In v1.1
        </h2>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Enter your name"
            value={guardName}
            onChange={(e) => setGuardName(e.target.value)}
            className="border p-2 rounded w-full mb-3"
            required
          />
        </div>

        {!captured ? (
          <div className="flex flex-col items-center gap-3">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              width="300"
              height="300"
              className="rounded-xl border shadow-md"
            ></video>
            <button
              onClick={capturePhoto}
              className="bg-accent text-white px-5 py-2 rounded-xl shadow hover:bg-accent/90 transition"
            >
              Capture Selfie
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <img
              src={captured}
              alt="Captured"
              className="rounded-xl shadow-md max-h-80 object-cover"
            />
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 bg-green-500 text-white px-5 py-2 rounded-xl shadow hover:bg-green-600 transition"
            >
              <CheckCircle className="w-5 h-5" />
              {loading ? "Submitting..." : "Submit Attendance"}
            </button>
          </div>
        )}

        <canvas ref={canvasRef} width="300" height="300" hidden></canvas>

        {coords && (
          <p className="text-sm text-gray-500 mt-4 flex items-center gap-1">
            <MapPin className="w-4 h-4 text-accent" />
            GPS: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
          </p>
        )}

        {status && <p className="mt-2 text-gray-600 text-sm">{status}</p>}
      </motion.div>
    </ErrorBoundary>
  );
}
