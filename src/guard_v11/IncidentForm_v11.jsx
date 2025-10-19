// PRU Patrol Sandbox v1.1 – IncidentForm_v11.jsx
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { supabase } from "../lib/supabaseClient";
import { sendTelegramPhoto } from "../shared_v11/api/telegram";
import { Upload, Image, Send, Camera, X } from "lucide-react";
import { logEvent } from "../lib/logEvent";

export default function IncidentForm_v11() {
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Auto-fill from localStorage
  const [guardName, setGuardName] = useState(localStorage.getItem("guardName") || "");
  const [plateNo, setPlateNo] = useState(localStorage.getItem("plateNo") || "");
  
  // Camera functionality
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

  // Camera functionality
  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setMode('camera');
      }
    } catch (err) {
      console.error("Camera access failed:", err);
      setStatus("❌ Camera access denied");
      setTimeout(() => setStatus(""), 3000);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      const dataURL = canvas.toDataURL('image/jpeg');
      setPhotoPreview(dataURL);
      setPreview(dataURL);
      
      // Stop camera
      const stream = video.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      setMode(null);
    }
  };

  const closeCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
    }
    setMode(null);
  };

  const resetForm = () => {
    setDescription("");
    setPhoto(null);
    setPreview("");
    setPhotoPreview("");
    setStatus("");
  };

  // Upload helper function
  const uploadPhoto = async (imageData, fileName) => {
    let blob;
    
    if (typeof imageData === 'string' && imageData.startsWith('data:')) {
      // Convert dataURL to Blob
      const response = await fetch(imageData);
      blob = await response.blob();
    } else {
      // File object
      blob = imageData;
    }
    
    const filePath = `incident/${guardName || 'unknown'}_${Date.now()}.jpg`;
    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from("incident-photos")
      .upload(filePath, blob, {
        upsert: true,
        contentType: "image/jpeg",
      });
    
    if (uploadErr) throw uploadErr;
    
    const { data: publicUrlData } = supabase.storage
      .from("incident-photos")
      .getPublicUrl(uploadData.path);
    
    return publicUrlData.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus("Getting location...");

    try {
      // Get current geolocation
      let lat = null;
      let lon = null;
      
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          });
        });
        
        lat = position?.coords?.latitude?.toFixed(6) ?? null;
        lon = position?.coords?.longitude?.toFixed(6) ?? null;
      } catch (geoErr) {
        console.warn("Geolocation failed:", geoErr);
        // Continue without location
      }

      let photoUrl = null;
      
      // Determine final image source and upload
      if (photoPreview) {
        setStatus("Uploading camera photo...");
        photoUrl = await uploadPhoto(photoPreview);
      } else if (photo) {
        setStatus("Uploading file photo...");
        photoUrl = await uploadPhoto(photo);
      }

      // Insert incident record
      setStatus("Saving incident...");
      const { error: insertError } = await supabase.from("incidents").insert([
        {
          guard_name: guardName,
          plate_no: plateNo,
          description,
          photo_url: photoUrl,
          lat,
          lon,
          created_at: new Date().toISOString()
        },
      ]);

      if (insertError) throw insertError;

      // Send Telegram alert with location links
      setStatus("Sending alert...");
      const osmLink = lat && lon ? `OSM: [OpenStreetMap](https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=19/${lat}/${lon})` : '';
      const googleLink = lat && lon ? `Google: [Google Maps](https://maps.google.com/?q=${lat},${lon})` : '';
      
      const caption = `🚨 New Incident Report
👤 ${guardName || '-'}
🏍️ ${plateNo || '-'}
📝 ${description}
${osmLink}
${googleLink}
🕓 ${new Date().toLocaleString()}`;
      
      await sendTelegramPhoto(photoUrl || "", caption);

      // Log the event
      await logEvent("INCIDENT", description, "Guard");

      // Success - reset form and show success message
      resetForm();
      setStatus("✅ Incident submitted successfully!");
      
      // Clear success message after 3 seconds
      setTimeout(() => setStatus(""), 3000);
      
    } catch (err) {
      console.error("Incident submit failed:", err);
      setStatus(`❌ Upload failed: ${err.message}`);
      
      // Clear error message after 5 seconds
      setTimeout(() => setStatus(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="bg-white rounded-2xl shadow-md p-6 mt-10"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <h2 className="text-2xl font-semibold text-primary mb-4 flex items-center gap-2">
        <Upload className="w-5 h-5 text-accent" /> Submit Incident Report v1.1
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4" disabled={loading}>
        {/* Guard Name and Plate Number Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Guard Name</label>
            <input
              type="text"
              value={guardName}
              onChange={(e) => setGuardName(e.target.value)}
              disabled={loading}
              className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-accent outline-none ${
                loading ? "bg-gray-100 cursor-not-allowed" : ""
              }`}
              placeholder="Guard name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plate Number</label>
            <input
              type="text"
              value={plateNo}
              onChange={(e) => setPlateNo(e.target.value)}
              disabled={loading}
              className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-accent outline-none ${
                loading ? "bg-gray-100 cursor-not-allowed" : ""
              }`}
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
          className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-accent outline-none resize-none ${
            loading ? "bg-gray-100 cursor-not-allowed" : ""
          }`}
          rows={3}
        />

        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <label className="cursor-pointer flex items-center gap-3 text-accent font-medium hover:text-accent/80">
              <Image className="w-5 h-5" />
              <span>Attach Photo</span>
              <input type="file" accept="image/*" hidden onChange={handleFileChange} />
            </label>
            
            <button
              type="button"
              onClick={openCamera}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 text-accent font-medium hover:text-accent/80 disabled:opacity-50"
            >
              <Camera className="w-5 h-5" />
              <span>Camera</span>
            </button>
          </div>

          {preview && (
            <motion.img
              src={preview}
              alt="Preview"
              className="rounded-xl shadow-md max-h-56 object-cover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            />
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl shadow transition ${
            loading 
              ? "bg-gray-400 cursor-not-allowed" 
              : "bg-accent text-white hover:bg-accent/90"
          }`}
        >
          <Send className="w-4 h-4" /> 
          {loading ? "Submitting..." : "Submit Report"}
        </button>

        {status && (
          <div className={`mt-2 p-3 rounded-lg text-sm ${
            status.includes("✅") 
              ? "bg-green-100 text-green-800 border border-green-200" 
              : status.includes("❌")
              ? "bg-red-100 text-red-800 border border-red-200"
              : "bg-blue-100 text-blue-800 border border-blue-200"
          }`}>
            {status}
          </div>
        )}
      </form>

      {/* Camera Modal */}
      {mode === 'camera' && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Take Photo</h3>
              <button
                onClick={closeCamera}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-64 bg-gray-900 rounded-xl object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>
            
            <div className="flex gap-3 mt-4">
              <button
                onClick={capturePhoto}
                className="flex-1 bg-accent text-white py-3 px-4 rounded-xl font-medium hover:bg-accent/90"
              >
                Capture Photo
              </button>
              <button
                onClick={closeCamera}
                className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}