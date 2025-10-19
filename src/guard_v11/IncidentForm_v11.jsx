// PRU Patrol Sandbox v1.1 – IncidentForm_v11.jsx
import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../../lib/supabaseClient";
import { sendTelegramPhoto } from "../../lib/telegram";
import { Upload, Image, Send } from "lucide-react";
import { logEvent } from "../../lib/logEvent";

export default function IncidentForm_v11() {
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const resetForm = () => {
    setDescription("");
    setPhoto(null);
    setPreview("");
    setStatus("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus("Uploading...");

    // Debug logs
    console.log("🔍 URL:", import.meta.env.VITE_SUPABASE_URL);
    console.log("🔍 KEY:", import.meta.env.VITE_SUPABASE_KEY ? "✅ detected" : "❌ missing");

    try {
      const guardName = localStorage.getItem("guardName") || "-";
      const plateNo = localStorage.getItem("plateNo") || "-";

      let photoUrl = null;
      
      // Upload photo if exists
      if (photo) {
        setStatus("Uploading photo...");
        const filePath = `incidents/${guardName}_${Date.now()}_${photo.name}`;
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from("patrol-photos")
          .upload(filePath, photo, {
            upsert: true,
            contentType: photo.type || "image/jpeg",
          });
        
        if (uploadErr) throw uploadErr;
        
        const { data: publicUrlData } = supabase.storage
          .from("patrol-photos")
          .getPublicUrl(uploadData.path);
        photoUrl = publicUrlData.publicUrl;
      }

      // Insert incident record
      setStatus("Saving incident...");
      const { error: insertError } = await supabase.from("incidents").insert([
        {
          description,
          photo_url: photoUrl,
          guard_name: guardName,
          plate_no: plateNo,
        },
      ]);

      if (insertError) throw insertError;

      // Send Telegram alert
      setStatus("Sending alert...");
      const caption = `🚨 New Incident Report\n👤 ${guardName}\n🏍️ ${plateNo}\n📝 ${description}\n🕓 ${new Date().toLocaleString()}`;
      await sendTelegramPhoto(photoUrl || "https://upload.wikimedia.org/wikipedia/commons/8/84/Example.svg", caption);

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
          <label className="cursor-pointer flex items-center gap-3 text-accent font-medium hover:text-accent/80">
            <Image className="w-5 h-5" />
            <span>Attach Photo</span>
            <input type="file" accept="image/*" hidden onChange={handleFileChange} />
          </label>

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
    </motion.div>
  );
}