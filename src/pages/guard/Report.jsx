import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { sendTelegramPhoto } from "../../lib/telegram";
import GuardBottomNav from "../../components/GuardBottomNav";

export default function Report() {
  const [message, setMessage] = useState("");
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const guardName = localStorage.getItem("guardName") || "-";
  const plateNo = localStorage.getItem("plateNo") || "-";

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setPhoto(file);
  };

  const uploadToSupabase = async (file) => {
    const filePath = `incidents/${guardName}_${Date.now()}_${file.name}`;
    const { error } = await supabase.storage
      .from("patrol-photos")
      .upload(filePath, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from("patrol-photos").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async () => {
    if (!message && !photo) return alert("Please type a message or upload a photo.");
    setLoading(true);
    try {
      let photoUrl = "";
      if (photo) photoUrl = await uploadToSupabase(photo);

      // send to Telegram
      const caption = `🚨 Incident Report\n👤 Guard: ${guardName}\n🏍️ Plate: ${plateNo}\n🕓 ${new Date().toLocaleString()}\n📝 Message: ${message || "(No text)"} `;
      await sendTelegramPhoto(photoUrl || "https://upload.wikimedia.org/wikipedia/commons/8/84/Example.svg", caption);

      // save record to Supabase
      const { error: insertError } = await supabase.from("incidents").insert({
        guard_name: guardName,
        plate_no: plateNo,
        description: message,
        photo_url: photoUrl,
      });
      
      if (insertError) throw insertError;

      alert("✅ Report sent to admin!");
      setMessage("");
      setPhoto(null);
    } catch (err) {
      console.error(err);
      alert("❌ Failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-5 pb-20 space-y-5">
      <h1 className="text-2xl font-bold text-primary">Incident Report</h1>

      <textarea
        placeholder="Describe what happened..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="border rounded-lg w-full p-3 h-32"
      />

      <input type="file" onChange={handleFileChange} className="block w-full text-sm" />

      {photo && (
        <div className="mt-3">
          <img
            src={URL.createObjectURL(photo)}
            alt="preview"
            className="w-48 h-48 object-cover rounded-lg border"
          />
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full mt-4"
      >
        {loading ? "Sending..." : "Send Report"}
      </button>

      <GuardBottomNav />
    </div>
  );
}
