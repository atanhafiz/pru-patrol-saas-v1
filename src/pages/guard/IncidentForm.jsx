import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../../lib/supabaseClient";
import { sendTelegramPhoto } from "../../lib/telegram";
import { Upload, Image, Send } from "lucide-react";
import { logEvent } from "../../lib/logEvent";

export default function IncidentForm() {
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState("");
  const [status, setStatus] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Uploading...");

    // Debug logs
    console.log("🔍 URL:", import.meta.env.VITE_SUPABASE_URL);
    console.log("🔍 KEY:", import.meta.env.VITE_SUPABASE_KEY ? "✅ detected" : "❌ missing");

    try {
      const guardName = localStorage.getItem("guardName") || "-";
      const plateNo = localStorage.getItem("plateNo") || "-";

      let photoUrl = "";
      if (photo) {
        const filePath = `incidents/${guardName}_${Date.now()}_${photo.name}`;
        const { error: uploadErr } = await supabase.storage
          .from("patrol-photos")
          .upload(filePath, photo, {
            upsert: true,
            contentType: photo.type || "image/jpeg",
          });
        if (uploadErr) throw uploadErr;
        const { data } = supabase.storage
          .from("patrol-photos")
          .getPublicUrl(filePath);
        photoUrl = data.publicUrl;
      }

      // ✅ Clean Supabase insert
      const { error } = await supabase.from("incidents").insert([
        {
          description,
          photo_url: photoUrl,
          guard_name: guardName,
          plate_no: plateNo,
        },
      ]);

      if (error) throw error;

      // ✅ Telegram alert
      const caption = `🚨 New Incident Report\n👤 ${guardName}\n🏍️ ${plateNo}\n📝 ${description}\n🕓 ${new Date().toLocaleString()}`;
      await sendTelegramPhoto(photoUrl || "https://upload.wikimedia.org/wikipedia/commons/8/84/Example.svg", caption);

      setDescription("");
      setPhoto(null);
      setPreview("");
      setStatus("✅ Report sent to admin!");
      await logEvent("INCIDENT", description, "Guard");
    } catch (err) {
      console.error("Incident submit failed:", err);
      setStatus("❌ Upload failed: " + err.message);
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
        <Upload className="w-5 h-5 text-accent" /> Submit Incident Report
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          placeholder="Describe the incident..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-accent outline-none resize-none"
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
          className="flex items-center gap-2 bg-accent text-white px-5 py-2 rounded-xl shadow hover:bg-accent/90 transition"
        >
          <Send className="w-4 h-4" /> Submit Report
        </button>

        {status && <p className="text-sm text-gray-500 mt-2">{status}</p>}
      </form>
    </motion.div>
  );
}
