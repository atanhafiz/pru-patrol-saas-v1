import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import AppRouter from "./router/index.jsx";
import RouterV11 from "./router/router_v11.jsx";
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "react-hot-toast";
import "./index.css";

const isSandbox = import.meta.env.VITE_SANDBOX_MODE === "true";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {isSandbox ? (
      <>
        <RouterV11 />
        <Toaster position="bottom-right" />
      </>
    ) : (
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </BrowserRouter>
    )}
  </React.StrictMode>
);

