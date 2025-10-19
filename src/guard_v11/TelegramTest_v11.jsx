// PRU Patrol Sandbox v1.1 – TelegramTest_v11.jsx
import { useState } from "react";
import { motion } from "framer-motion";
import { sendTelegramAlert, sendTelegramPhoto } from "../shared_v11/api/telegram";
import { MessageSquare, Camera, CheckCircle, XCircle } from "lucide-react";

export default function TelegramTest_v11() {
  const [alertStatus, setAlertStatus] = useState("");
  const [photoStatus, setPhotoStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTestAlert = async () => {
    setLoading(true);
    setAlertStatus("Sending...");
    
    try {
      await sendTelegramAlert("TEST", { message: "✅ Sandbox v1.1 alert working!" });
      setAlertStatus("✅ Alert sent successfully!");
      console.log("✅ Telegram alert test successful");
    } catch (error) {
      setAlertStatus("❌ Alert failed");
      console.error("❌ Telegram alert test failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestPhoto = async () => {
    setLoading(true);
    setPhotoStatus("Sending...");
    
    try {
      await sendTelegramPhoto("https://picsum.photos/300", "📸 Test photo from Sandbox v1.1");
      setPhotoStatus("✅ Photo sent successfully!");
      console.log("✅ Telegram photo test successful");
    } catch (error) {
      setPhotoStatus("❌ Photo failed");
      console.error("❌ Telegram photo test failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="bg-white rounded-2xl shadow-md p-6 mt-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <h2 className="text-2xl font-semibold text-primary mb-4 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-accent" /> Telegram API Test v1.1
      </h2>

      <div className="space-y-4">
        {/* Test Alert Button */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">Test Alert Message</h3>
          <button
            onClick={handleTestAlert}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
          >
            <MessageSquare className="w-4 h-4" />
            Send Test Alert
          </button>
          {alertStatus && (
            <div className={`mt-2 flex items-center gap-2 text-sm ${
              alertStatus.includes("✅") ? "text-green-600" : "text-red-600"
            }`}>
              {alertStatus.includes("✅") ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              {alertStatus}
            </div>
          )}
        </div>

        {/* Test Photo Button */}
        <div className="bg-green-50 rounded-lg p-4">
          <h3 className="font-semibold text-green-800 mb-2">Test Photo Message</h3>
          <button
            onClick={handleTestPhoto}
            disabled={loading}
            className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
          >
            <Camera className="w-4 h-4" />
            Send Test Photo
          </button>
          {photoStatus && (
            <div className={`mt-2 flex items-center gap-2 text-sm ${
              photoStatus.includes("✅") ? "text-green-600" : "text-red-600"
            }`}>
              {photoStatus.includes("✅") ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              {photoStatus}
            </div>
          )}
        </div>

        {/* Environment Check */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-2">Environment Check</h3>
          <div className="text-sm space-y-1">
            <div className={`flex items-center gap-2 ${
              import.meta.env.VITE_TELEGRAM_BOT_TOKEN ? "text-green-600" : "text-red-600"
            }`}>
              {import.meta.env.VITE_TELEGRAM_BOT_TOKEN ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              Bot Token: {import.meta.env.VITE_TELEGRAM_BOT_TOKEN ? "✅ Configured" : "❌ Missing"}
            </div>
            <div className={`flex items-center gap-2 ${
              import.meta.env.VITE_TELEGRAM_CHAT_ID ? "text-green-600" : "text-red-600"
            }`}>
              {import.meta.env.VITE_TELEGRAM_CHAT_ID ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              Chat ID: {import.meta.env.VITE_TELEGRAM_CHAT_ID ? "✅ Configured" : "❌ Missing"}
            </div>
          </div>
        </div>

        {loading && (
          <div className="text-center text-blue-600">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2">Processing...</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
