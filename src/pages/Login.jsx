import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      const user = data?.user ?? data?.session?.user;
      if (!user) throw new Error("Login succeeded but no user returned.");

      // 🔍 Fetch profile
      const { data: prof, error: profErr } = await supabase
        .from("profiles")
        .select("role, full_name")
        .eq("id", user.id)
        .single();

      if (profErr) throw profErr;

      // Set localStorage for guards
      if (prof?.role === "guard") {
        localStorage.setItem("guardName", prof.full_name || "Guard");
        localStorage.setItem("plateNo", "Unknown");
        console.log("✅ localStorage updated:", prof.full_name || "Guard", "Unknown");
      }

      setMsg("✅ Login successful! Redirecting...");
      setTimeout(() => {
        if (prof?.role === "admin") navigate("/admin/dashboard");
        else if (prof?.role === "guard") navigate("/guard/dashboard");
        else navigate("/");
      }, 800);
    } catch (err) {
      console.error("Login error:", err.message);
      setMsg("❌ " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
<div className="min-h-screen flex items-center justify-center bg-soft px-4">
  <form
    onSubmit={handleLogin}
    className="bg-white shadow-xl p-10 rounded-2xl w-full max-w-md border border-gray-100"
  >
    <h2 className="text-[26px] font-extrabold text-center mb-8 text-[#0B132B] tracking-tight">
      🔒 Authorized Personnel Login Only
    </h2>

    {msg && (
      <p
        className={`text-sm text-center mb-4 ${
          msg.startsWith("✅") ? "text-green-600" : "text-red-500"
        }`}
      >
        {msg}
      </p>
    )}

    {/* ...login form fields below this (email, password, etc.) */}

        <div className="mb-4">
          <label className="block text-sm font-medium text-primary mb-1">
            Email
          </label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-gray-300 w-full p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-primary mb-1">
            Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-gray-300 w-full p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white font-semibold py-3 rounded-lg hover:bg-opacity-90 transition"
        >
          {loading ? "Signing in..." : "Login"}
        </button>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don’t have an account?{" "}
          <a href="/register" className="text-accent font-semibold hover:underline">
            Register
          </a>
        </p>
      </form>
    </div>
  );
}
