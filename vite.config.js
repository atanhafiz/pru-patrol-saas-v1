import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import * as dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  plugins: [react()],
  base: "/", // 🔥 penting untuk Netlify handle SPA route
  define: {
    "process.env": process.env,
  },
});
