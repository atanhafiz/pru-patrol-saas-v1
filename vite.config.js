import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import * as dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  plugins: [react()],
  base: "./", // for Netlify relative paths
  define: {
    "process.env": process.env,
  },
});
