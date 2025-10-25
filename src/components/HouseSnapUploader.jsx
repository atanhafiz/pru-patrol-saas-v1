// AHE SmartPatrol Hybrid Stable – HouseSnapUploader.jsx
import { useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { sendTelegramPhoto } from "../shared_v11/api/telegram";
import { Camera, Loader2, X } from "lucide-react";
import toast from "react-hot-toast";

export default function HouseSnapUploader({
  houseLabel = "House",
  guardName = "Guard",
  plateNo = "-",
  onUploaded = () => {},
}) {
  const [open, setOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // open rear camera direct
  const openCamera = async () => {
    setOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: "environment" } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error("Camera error:", err);
      toast.error("Cannot access rear camera. Please allow permission.");
      setOpen(false);
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    if (stream) stream.getTracks().forEach((t) => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
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

  const handleUpload = async () => {
    if (!photoPreview) return;
    setLoading(true);
    try {
      const ts = Date.now();
      const coords = "No GPS";
      const filePath = `houses/${guardName}_${plateNo}_${ts}.jpg`;

      const blob = dataURLtoBlob(photoPreview);
      const { error: upErr } = await supabase.storage
        .from("patrol-photos")
        .upload(filePath, blob, { upsert: true, contentType: "image/jpeg" });
      if (upErr) throw upErr;
      const { data } = await supabase.storage
        .from("patrol-photos")
        .getPublicUrl(filePath);
      const photoUrl = data.publicUrl;

      const caption = `🏠 ${houseLabel}\n👤 ${guardName}\n🏍️ ${plateNo}\n📍 ${coords}\n🕓 ${new Date().toLocaleString()}`;
      await sendTelegramPhoto(photoUrl, caption);

      toast.success("✅ Sent to Telegram!");
      // ✅ Delay tutup modal supaya parent sempat update “Done”
      onUploaded();
      setTimeout(() => {
        setOpen(false);
        setPhotoPreview(null);
      }, 1000);   

    } catch (err) {
      console.error("Upload failed:", err);
      toast.error("Upload failed: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={openCamera}
        className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm flex items-center gap-2"
      >
        <Camera className="w-4 h-4" /> Snap
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999]">
          <div className="bg-white p-4 rounded-xl shadow-lg w-[420px] relative">
            <button
              onClick={() => {
                stopCamera();
                setOpen(false);
                setPhotoPreview(null);
              }}
              className="absolute top-2 right-2 bg-gray-200 p-1 rounded-full"
            >
              <X size={18} />
            </button>

            <video
              ref={videoRef}
              width="400"
              height="300"
              className="rounded-md"
              autoPlay
              playsInline
            />
            <canvas ref={canvasRef} width="400" height="300" hidden />

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
                disabled={loading}
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
          </div>
        </div>
      )}
    </>
  );
}
