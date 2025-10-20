import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import AppRouter from "./router"; // ✅ guna router baru (clean)
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "react-hot-toast";
import "./index.css";

// remove sandbox toggle (optional kalau tak guna)
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <AppRouter />
        <Toaster position="bottom-right" />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
